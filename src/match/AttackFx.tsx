import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { AttackEvent, FieldCard } from '../../shared/game.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import { CharacterCardView } from './GameCards.tsx'
import { HeartIcon } from './icons.tsx'
import { playImpact, playLifeHit, playShatter, playWhoosh, unlockAudio } from './sfx.ts'
import './AttackFx.css'

/** Total length of the sequence; keep in sync with the 2.4s animations in AttackFx.css. */
const DURATION_MS = 2400
// Beats of the timeline, matching the CSS delays.
const STRIKE_MS = 420
const IMPACT_MS = 600
const BREAK_MS = 760
const LIFE_MS = 900
const ATTACKER_BREAK_MS = 1000

/** Six jagged fragments that tile the card; each flies outward from the impact. */
const SHARDS: { clip: string; dx: string; dy: string; rot: string }[] = [
  { clip: 'polygon(0 0, 55% 0, 40% 35%, 0 45%)', dx: '-46px', dy: '-58px', rot: '-24deg' },
  { clip: 'polygon(55% 0, 100% 0, 100% 30%, 62% 42%, 40% 35%)', dx: '52px', dy: '-64px', rot: '28deg' },
  { clip: 'polygon(0 45%, 40% 35%, 62% 42%, 48% 70%, 0 78%)', dx: '-64px', dy: '6px', rot: '-36deg' },
  { clip: 'polygon(62% 42%, 100% 30%, 100% 66%, 48% 70%)', dx: '70px', dy: '12px', rot: '32deg' },
  { clip: 'polygon(0 78%, 48% 70%, 58% 100%, 0 100%)', dx: '-40px', dy: '72px', rot: '-18deg' },
  { clip: 'polygon(48% 70%, 100% 66%, 100% 100%, 58% 100%)', dx: '48px', dy: '78px', rot: '22deg' },
]

type Props = {
  event: AttackEvent | null
  myId: string
  names: Record<string, string>
}

/**
 * Plays each new attack once as a short clash over the board: the attacker lunges, the hit lands,
 * and destroyed cards shatter. It never takes clicks, so the next turn can start underneath.
 */
export function AttackFx({ event, myId, names }: Props) {
  const { t } = useI18n()
  // The attack already on screen when the match opens is history, not news.
  const seen = useRef(event?.id ?? 0)
  const [shown, setShown] = useState<AttackEvent | null>(null)

  // Audio may only start after a user gesture; any click or key on the page unlocks it.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  // Every game update sends a fresh object for the same attack, so the effect keys on the id
  // and reads the attack from a ref.
  const latest = useRef(event)
  useEffect(() => {
    latest.current = event
  })
  const eventId = event?.id
  useEffect(() => {
    const event = latest.current
    if (!event || event.id <= seen.current) return
    seen.current = event.id
    setShown(event)
    const targetBroke = event.target !== null && event.targetResistanceAfter === null
    const timers = [
      window.setTimeout(playWhoosh, STRIKE_MS),
      window.setTimeout(() => playImpact(targetBroke || event.power >= 6), IMPACT_MS),
      targetBroke && window.setTimeout(() => playShatter(), BREAK_MS),
      event.lifeDamage > 0 && window.setTimeout(playLifeHit, LIFE_MS),
      event.attackerAttackAfter === null && window.setTimeout(() => playShatter(0.6), ATTACKER_BREAK_MS),
      window.setTimeout(() => setShown(null), DURATION_MS),
    ]
    return () => timers.forEach((t) => t && window.clearTimeout(t))
  }, [eventId])

  if (!shown) return null
  const mine = shown.attackerPlayerId === myId
  const defenderName = names[shown.defenderPlayerId] ?? t.common.opponent
  const targetBroke = shown.target !== null && shown.targetResistanceAfter === null
  const attackerBroke = shown.attackerAttackAfter === null

  const results: string[] = []
  if (shown.target) {
    results.push(
      targetBroke
        ? t.fx.destroyed(shown.target.card.name)
        : t.fx.resistanceLeft(shown.target.card.name, shown.targetResistanceAfter),
    )
  }
  if (shown.lifeDamage > 0) results.push(t.fx.damageOn(shown.lifeDamage, mine ? defenderName : t.fx.youObject))
  if (attackerBroke) results.push(t.fx.alsoDestroyed(shown.attacker.card.name))

  return (
    <div key={shown.id} className="fx" aria-hidden="true">
      <div className="fx-stage">
        <p className="fx-caption">{mine ? t.fx.youAttacked : t.fx.attacked(names[shown.attackerPlayerId] ?? t.common.opponent)}</p>
        <div className="fx-row">
          <FxCard field={shown.attacker} role="attacker" broken={attackerBroke} loss={shown.target ? shown.guard : null} />
          {shown.target ? (
            <FxCard field={shown.target} role="target" broken={targetBroke} loss={shown.power} />
          ) : (
            <div className="fx-life fx-target-slot">
              <span className="fx-flash" />
              <HeartIcon size={56} />
              <strong>{shown.defenderLifeAfter + shown.lifeDamage}</strong>
              <span>{mine ? defenderName : t.fx.yourLife}</span>
            </div>
          )}
          {shown.lifeDamage > 0 && <span className="fx-life-loss">{t.fx.lifeLoss(shown.lifeDamage)}</span>}
        </div>
        <p className="fx-result">{results.join(' · ')}</p>
      </div>
    </div>
  )
}

function FxCard({
  field,
  role,
  broken,
  loss,
}: {
  field: FieldCard
  role: 'attacker' | 'target'
  broken: boolean
  /** Points this card loses in the clash (resistance for the target, strength for the attacker). */
  loss: number | null
}) {
  const { t } = useI18n()
  const card = <CharacterCardView card={field.card} attack={field.attack} resistance={field.resistance} />
  return (
    <div className={`fx-card fx-${role}${broken ? ' is-broken' : ''}${role === 'target' ? ' fx-target-slot' : ''}`}>
      <div className="fx-card-whole">
        {card}
        {broken && <Cracks />}
      </div>
      {broken &&
        SHARDS.map((s) => (
          <div
            key={s.clip}
            className="fx-shard"
            style={{ '--clip': s.clip, '--dx': s.dx, '--dy': s.dy, '--rot': s.rot } as CSSProperties}
          >
            {card}
          </div>
        ))}
      {role === 'target' && <span className="fx-flash" />}
      {loss !== null && loss > 0 && (
        <span className={`fx-damage ${role === 'target' ? 'is-res' : 'is-atk'}`}>−{loss}</span>
      )}
      {broken && <span className="fx-broken-label">{t.fx.destroyedTag}</span>}
    </div>
  )
}

/** Fracture lines drawn along the shard edges, shown in the instant before the card breaks. */
function Cracks() {
  return (
    <svg className="fx-cracks" viewBox="0 0 100 140" preserveAspectRatio="none">
      <path d="M55,0 L40,49 L0,63 M40,49 L62,59 L100,42 M62,59 L48,98 L0,109 M48,98 L100,92 M48,98 L58,140" />
    </svg>
  )
}
