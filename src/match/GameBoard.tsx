import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router'
import { resolveAttack, type AttackOutcome } from '../../shared/combat.ts'
import { MAX_FIELD, MAX_TURNS, START_LIFE, type FieldCard, type GameView } from '../../shared/game.ts'
import type { Team } from '../../shared/player.ts'
import type { ClientMessage } from '../../shared/protocol.ts'
import { TeamBadge } from '../components/TeamBadge.tsx'
import { useI18n } from '../i18n/I18nContext.ts'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher.tsx'
import { initialsOf } from '../player/initials.ts'
import { Rules } from '../rules/Rules.tsx'
import { CharacterCardView, SupportCardView, type CardState } from './GameCards.tsx'
import {
  ArrowIcon,
  CardsIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  PlusIcon,
  PointerIcon,
  SwordIcon,
  TargetIcon,
} from './icons.tsx'
import { isMuted, setMuted, subscribeMuted } from './sfx.ts'
import { useCountdown } from './useCountdown.ts'
import './GameBoard.css'

type Props = {
  game: GameView
  send: (msg: ClientMessage) => void
}

type Banner = {
  /** 'action': the player must do something now. 'wait': nothing to do. */
  tone: 'action' | 'wait'
  /** Index into the turn steps (choose, reveal, attack). */
  step: number
  icon: ReactNode
  eyebrow: string
  title: string
  text: string
}

// Remount per turn phase (key it on turn + phase) so selections reset between phases.
export function GameBoard({ game, send }: Props) {
  const { me, opponent, phase } = game
  const { t } = useI18n()
  const seconds = useCountdown(game.timeLeftMs, game)
  const [handPick, setHandPick] = useState<string | null>(null)
  const [useSupport, setUseSupport] = useState(false)
  const [attackerPick, setAttackerPick] = useState<string | null>(null)
  const [targetPick, setTargetPick] = useState<string | null>(null)

  const fieldFull = me.field.length >= MAX_FIELD
  const choosing = phase === 'choose' && !me.hasChosen && me.hand.length > 0 && !fieldFull
  const myAttack = phase === 'attack' && game.attackerId === me.player.id
  const directAttack = opponent.field.length === 0
  const pickingTarget = myAttack && attackerPick !== null && !directAttack
  const needsAction = choosing || myAttack

  const handCard = me.hand.find((c) => c.id === handPick) ?? null
  const attacker = me.field.find((f) => f.card.id === attackerPick) ?? null
  const target = opponent.field.find((f) => f.card.id === targetPick) ?? null
  const outcome =
    attacker && (target || directAttack)
      ? resolveAttack(game.turnSupports, me.player.id, attacker, opponent.player.id, target)
      : null

  // A short "your turn" pop-up, plus a tab title that stays flagged while the player must act.
  // Right after an attack the pop-up waits for the clash animation (AttackFx) to finish.
  const afterClash = phase === 'choose' && game.lastAttack?.turn === game.turn - 1
  const toastDelay = afterClash ? 2300 : 0
  const [toast, setToast] = useState(needsAction)
  const yourTurnTab = t.board.yourTurnTab
  useEffect(() => {
    if (!needsAction) return
    const baseTitle = document.title
    document.title = `(!) ${yourTurnTab} · ${baseTitle}`
    const id = window.setTimeout(() => setToast(false), 2200 + toastDelay)
    return () => {
      window.clearTimeout(id)
      document.title = baseTitle
    }
  }, [needsAction, toastDelay, yourTurnTab])

  function confirmCard() {
    if (!handPick) return
    send({ type: 'play-card', matchId: game.matchId, cardId: handPick, useSupport })
  }

  // Stays on the board so the player sees the result.
  function giveUp() {
    if (window.confirm(t.board.giveUpConfirm)) {
      send({ type: 'leave-match', matchId: game.matchId })
    }
  }

  function pickAttacker(cardId: string) {
    setAttackerPick(cardId)
    setTargetPick(null)
  }

  function confirmAttack() {
    if (!attackerPick || (!targetPick && !directAttack)) return
    send({
      type: 'attack',
      matchId: game.matchId,
      attackerCardId: attackerPick,
      targetCardId: directAttack ? null : targetPick,
    })
  }

  const banner = bannerFor()
  function bannerFor(): Banner | null {
    if (phase === 'over') return null
    if (phase === 'choose') {
      if (choosing) {
        return {
          tone: 'action',
          step: 0,
          icon: <CardsIcon size={28} />,
          eyebrow: t.board.banner.chooseEyebrow,
          title: t.board.banner.chooseTitle,
          text: t.board.banner.chooseText,
        }
      }
      const wait = { tone: 'wait', step: 0, icon: <ClockIcon size={28} /> } as const
      if (me.hasChosen) {
        return {
          ...wait,
          eyebrow: t.board.banner.chosenEyebrow,
          title: t.board.banner.chosenTitle(opponent.player.name),
          text: t.board.banner.chosenText,
        }
      }
      if (me.hand.length === 0) {
        return {
          ...wait,
          eyebrow: t.board.banner.noCardsEyebrow,
          title: t.board.banner.noCardsTitle,
          text: t.board.banner.noCardsText,
        }
      }
      return {
        ...wait,
        eyebrow: t.board.banner.fullEyebrow,
        title: t.board.banner.fullTitle(MAX_FIELD),
        text: t.board.banner.fullText,
      }
    }
    if (!myAttack) {
      return {
        tone: 'wait',
        step: 2,
        icon: <ClockIcon size={28} />,
        eyebrow: t.board.banner.theirAttackEyebrow,
        title: t.board.banner.theirAttackTitle(opponent.player.name),
        text: t.board.banner.theirAttackText,
      }
    }
    if (directAttack) {
      return {
        tone: 'action',
        step: 2,
        icon: <SwordIcon size={28} />,
        eyebrow: t.board.banner.attackEyebrow,
        title: attacker ? t.board.banner.confirmDirect : t.board.banner.pickAttacker,
        text: t.board.banner.directText,
      }
    }
    if (!attacker) {
      return {
        tone: 'action',
        step: 2,
        icon: <SwordIcon size={28} />,
        eyebrow: t.board.banner.step1,
        title: t.board.banner.pickAttacker,
        text: t.board.banner.step1Text,
      }
    }
    return {
      tone: 'action',
      step: 2,
      icon: <TargetIcon size={28} />,
      eyebrow: t.board.banner.step2,
      title: t.board.banner.step2Title,
      text: t.board.banner.step2Text,
    }
  }

  function myFieldState(f: FieldCard): CardState {
    if (!myAttack) return 'idle'
    if (f.card.id === attackerPick) return 'selected'
    return attackerPick ? 'idle' : 'playable'
  }

  function opponentFieldState(f: FieldCard): CardState {
    if (!pickingTarget) return 'idle'
    return f.card.id === targetPick ? 'targeted' : 'target'
  }

  const newTag = (f: FieldCard) => (f.placedTurn === game.turn ? t.board.newTag : undefined)

  return (
    <main className="board">
      {/* The arena scene, faded behind the whole board. */}
      <div className="board-backdrop" aria-hidden="true" style={{ backgroundImage: `url(${game.arena.image})` }} />
      <header className="board-top panel">
        <div className="board-arena">
          <img className="board-arena-art" src={game.arena.image} alt="" />
          <strong>{game.arena.name}</strong>{' '}
          {game.arena.favors ? (
            <span className={`team-badge team-badge-${game.arena.favors}`}>
              +1/+1 {t.teams[game.arena.favors]}
            </span>
          ) : (
            <span className="board-tag">{t.board.neutral}</span>
          )}
        </div>
        <div className="board-top-stats">
          <strong>{t.board.turn(game.turn, MAX_TURNS)}</strong>
          <span>{t.board.decks(me.deckCount, opponent.deckCount)}</span>
          <LanguageSwitcher />
          <SoundToggle />
          {phase !== 'over' && (
            <button type="button" className="btn btn-ghost board-leave" onClick={giveUp}>
              {t.board.giveUp}
            </button>
          )}
        </div>
      </header>

      {game.result && (
        <section className="panel board-result">
          <h2>
            {game.result.winnerId === null
              ? t.board.draw
              : game.result.winnerId === me.player.id
                ? t.board.won
                : t.board.lost}
          </h2>
          <p>
            {game.result.reason === 'forfeit' && game.result.winnerId === me.player.id
              ? t.board.opponentForfeit
              : game.result.reason === 'forfeit'
                ? t.board.youForfeit
                : game.result.reason === 'disconnect' && game.result.winnerId === me.player.id
                  ? t.board.opponentDisconnected
                  : t.board.endReasons[game.result.reason]}
          </p>
          <Link to="/home" className="btn">
            {t.common.backHome}
          </Link>
        </section>
      )}

      {banner && <TurnBanner banner={banner} seconds={seconds} />}

      <div className="board-main">
        <div className="board-play">
          <section
            className={`board-zone${pickingTarget ? ' is-targeting' : ''}`}
            aria-label={t.board.opponentArena}
          >
            <PlayerBar
              name={opponent.player.name}
              initials={initialsOf(opponent.player.name)}
              team={opponent.player.team}
              life={opponent.life}
              lifeLoss={outcome?.lifeDamage ?? 0}
              extra={t.board.opponentExtra(opponent.handCount, opponent.supportUsed)}
              status={
                phase === 'choose'
                  ? opponent.hasChosen
                    ? { label: t.board.ready, tone: 'done' }
                    : { label: t.board.choosing, tone: 'idle' }
                  : phase === 'attack' && !myAttack
                    ? { label: t.board.attacking, tone: 'alert' }
                    : undefined
              }
            />
            <div className="board-zone-cards">
              <ZoneLabel tone={pickingTarget ? 'target' : undefined}>
                {pickingTarget ? (
                  <>
                    <TargetIcon size={14} /> {t.board.clickTarget}
                  </>
                ) : (
                  t.board.opponentArenaCount(opponent.field.length, MAX_FIELD)
                )}
              </ZoneLabel>
              <div className="board-field">
                {opponent.field.map((f) => {
                  const state = opponentFieldState(f)
                  return (
                    <CharacterCardView
                      key={f.card.id}
                      card={f.card}
                      attack={f.attack}
                      resistance={f.resistance}
                      state={state}
                      tag={state === 'targeted' ? t.board.targetTag : newTag(f)}
                      onSelect={pickingTarget ? () => setTargetPick(f.card.id) : undefined}
                    />
                  )
                })}
                <EmptySlots count={MAX_FIELD - opponent.field.length} />
              </div>
            </div>
          </section>

          {game.turnSupports.length > 0 && (
            <section className="board-supports">
              <h3>{t.board.turnSupports}</h3>
              <div className="board-field">
                {game.turnSupports.map((s) => (
                  <SupportCardView key={s.support.id} card={s.support} />
                ))}
              </div>
            </section>
          )}

          <section
            className={`board-zone${myAttack && !attacker ? ' is-active' : ''}`}
            aria-label={t.board.myArena}
          >
            <PlayerBar
              name={t.board.you}
              initials={t.board.youInitials}
              team={me.player.team}
              life={me.life}
              extra={t.board.myExtra(me.player.name, me.supportUsed)}
            />
            <div className="board-zone-cards">
              <ZoneLabel tone={myAttack && !attacker ? 'action' : undefined}>
                {myAttack && !attacker ? (
                  <>
                    <PointerIcon size={14} /> {t.board.clickAttacker}
                  </>
                ) : myAttack ? (
                  t.board.switchAttackerHint
                ) : (
                  t.board.myArenaCount(me.field.length, MAX_FIELD)
                )}
              </ZoneLabel>
              <div className="board-field">
                {me.field.map((f) => {
                  const state = myFieldState(f)
                  return (
                    <CharacterCardView
                      key={f.card.id}
                      card={f.card}
                      attack={f.attack}
                      resistance={f.resistance}
                      state={state}
                      tag={state === 'selected' ? t.board.attackerTag : newTag(f)}
                      onSelect={myAttack ? () => pickAttacker(f.card.id) : undefined}
                    />
                  )
                })}
                <EmptySlots
                  count={MAX_FIELD - me.field.length}
                  incoming={choosing ? (handCard?.name ?? '') : undefined}
                />
              </div>
            </div>
          </section>

          <section className={`panel board-hand${choosing ? ' is-active' : ''}`} aria-label={t.board.hand}>
            <div className="board-hand-head">
              <h2>{t.board.hand}</h2>
              <span className={choosing ? 'board-hint is-action' : 'board-hint'}>
                {choosing ? (
                  <>
                    <PointerIcon size={16} /> {t.board.handHint}
                  </>
                ) : phase === 'attack' ? (
                  t.board.nextTurnHint
                ) : null}
              </span>
            </div>
            <div className="board-field board-hand-cards">
              {me.hand.map((card) => (
                <CharacterCardView
                  key={card.id}
                  card={card}
                  state={choosing ? (handPick === card.id ? 'selected' : 'playable') : myAttack ? 'dim' : 'idle'}
                  tag={choosing && handPick === card.id ? t.board.selectedTag : undefined}
                  onSelect={choosing ? () => setHandPick(card.id) : undefined}
                />
              ))}
              <div className="board-support-slot">
                <SupportCardView card={me.support} used={me.supportUsed} dim={myAttack} />
                {me.supportUsed ? null : (
                  <label className="board-support-toggle">
                    <input
                      type="checkbox"
                      checked={useSupport}
                      disabled={!choosing}
                      onChange={(e) => setUseSupport(e.target.checked)}
                    />
                    {t.board.useSupport}
                  </label>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="board-aside">
          <TurnGuide step={banner?.step ?? -1} myAttackTurn={phase === 'attack' ? myAttack : null} />
          <section className="panel board-log">
            <h2>{t.board.history}</h2>
            <ol>
              {game.log.map((line, i) => (
                <li key={i}>{t.log(line)}</li>
              ))}
            </ol>
          </section>
          {/* Collapsible so the rules can be read without leaving the match. */}
          <details className="panel board-rules">
            <summary>{t.board.allRules}</summary>
            <Rules />
          </details>
        </aside>
      </div>

      {/* Last child + sticky: stays pinned to the bottom of the screen while scrolling. */}
      {phase !== 'over' && (
        <div className="board-dock">
          <span className={seconds <= 10 ? 'board-dock-timer is-low' : 'board-dock-timer'}>
            <ClockIcon size={14} /> {seconds}s
          </span>
          {choosing ? (
            <>
              <div className="board-dock-summary">
                <span className="board-dock-label">{t.board.yourPlay}</span>
                {handCard ? (
                  <span>
                    <strong>{handCard.name}</strong>
                    {t.board.playStats(handCard.attack, handCard.resistance, useSupport)}
                  </span>
                ) : (
                  <span className="is-action">{t.board.pickFromHand}</span>
                )}
              </div>
              <button type="button" className="btn btn-action" disabled={!handCard} onClick={confirmCard}>
                {handCard ? t.board.play(handCard.name) : t.board.playCard}
              </button>
            </>
          ) : myAttack ? (
            <>
              <AttackSummary
                attacker={attacker}
                target={target}
                direct={directAttack}
                opponentName={opponent.player.name}
                opponentLife={opponent.life}
                outcome={outcome}
              />
              <div className="board-dock-actions">
                {attacker && (
                  <button type="button" className="btn btn-ghost" onClick={() => {
                      setAttackerPick(null)
                      setTargetPick(null)
                    }}
                  >
                    {t.board.switchAttacker}
                  </button>
                )}
                <button type="button" className="btn btn-action" disabled={!outcome} onClick={confirmAttack}>
                  {directAttack ? t.board.attackDirect : t.board.confirmAttack}
                </button>
              </div>
            </>
          ) : (
            <p className="board-dock-summary">{banner?.title}</p>
          )}
        </div>
      )}

      {toast && (
        <div className="board-toast" role="status" style={{ animationDelay: `${toastDelay}ms` }}>
          {myAttack ? t.board.toastAttack : t.board.toastChoose}
        </div>
      )}
    </main>
  )
}

function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted)
  const { t } = useI18n()
  return (
    <button
      type="button"
      className="btn btn-ghost board-sound"
      onClick={() => setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? t.board.soundOn : t.board.soundOff}
      title={muted ? t.board.soundOn : t.board.soundOff}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
      </svg>
    </button>
  )
}

function TurnBanner({ banner, seconds }: { banner: Banner; seconds: number }) {
  const { t } = useI18n()
  return (
    <section className={`board-banner is-${banner.tone}`} aria-live="polite">
      <span className="board-banner-icon">{banner.icon}</span>
      <div className="board-banner-text">
        <span className="board-banner-eyebrow">{banner.eyebrow}</span>
        <h1>{banner.title}</h1>
        <p>{banner.text}</p>
      </div>
      <ol className="board-steps" aria-label={t.board.banner.stepsLabel}>
        {t.board.steps.map((label, i) => (
          <li
            key={label}
            className={i === banner.step ? 'is-current' : i < banner.step ? 'is-done' : undefined}
            aria-current={i === banner.step ? 'step' : undefined}
          >
            {i < banner.step ? <CheckIcon size={13} /> : `${i + 1} `}
            {label}
          </li>
        ))}
      </ol>
      <div className={seconds <= 10 ? 'board-banner-timer is-low' : 'board-banner-timer'}>
        <strong>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </strong>
        <span>{banner.tone === 'action' ? t.board.banner.remaining : t.board.banner.waiting}</span>
      </div>
    </section>
  )
}

function TurnGuide({ step, myAttackTurn }: { step: number; myAttackTurn: boolean | null }) {
  const { t } = useI18n()
  const g = t.board.guide
  const items = [
    [g.chooseTitle, g.chooseText],
    [g.revealTitle, g.revealText],
    [g.attackTitle, myAttackTurn === false ? g.attackTheirs : g.attackText],
  ]
  return (
    <section className="panel board-guide">
      <h2>{t.board.guideTitle}</h2>
      <ol>
        {items.map(([title, text], i) => (
          <li key={title} className={i === step ? 'is-current' : undefined}>
            <span className="board-guide-num">{i + 1}</span>
            <span>
              <strong>{title}</strong> {text}
            </span>
          </li>
        ))}
      </ol>
      {myAttackTurn && (
        <>
          <h3>{g.howAttackWorks}</h3>
          <ul>
            {g.attackRules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

type AttackSummaryProps = {
  attacker: FieldCard | null
  target: FieldCard | null
  direct: boolean
  opponentName: string
  opponentLife: number
  outcome: AttackOutcome | null
}

function AttackSummary({ attacker, target, direct, opponentName, opponentLife, outcome }: AttackSummaryProps) {
  const { t } = useI18n()
  const fx = t.board.effects
  const effects: { text: string; tone: 'good' | 'bad' | 'neutral' }[] = []
  if (outcome && attacker) {
    if (target) {
      effects.push(
        outcome.targetResistance === null
          ? { text: fx.targetLeaves(target.card.name), tone: 'good' }
          : { text: fx.targetResistance(target.card.name, outcome.targetResistance), tone: 'good' },
      )
    }
    if (outcome.lifeDamage > 0) {
      const after = Math.max(0, opponentLife - outcome.lifeDamage)
      effects.push({
        text: fx.lifeDamage(outcome.lifeDamage, opponentName, opponentLife, after),
        tone: 'good',
      })
    }
    if (target) {
      effects.push(
        outcome.attackerAttack === null
          ? { text: fx.attackerLeaves(attacker.card.name), tone: 'bad' }
          : { text: fx.attackerAttack(attacker.card.name, outcome.attackerAttack), tone: 'neutral' },
      )
    }
  }
  return (
    <div className="board-dock-summary">
      <div className="board-attack-line">
        <span>
          <span className="board-dock-label">{t.board.attacker}</span>
          {attacker ? (
            <strong>
              {attacker.card.name} ({outcome?.power ?? attacker.attack})
            </strong>
          ) : (
            <span className="is-action">{t.board.pickInYourArena}</span>
          )}
        </span>
        <ArrowIcon size={20} />
        <span>
          <span className="board-dock-label">{t.board.target}</span>
          {direct ? (
            <strong>{t.board.lifeOf(opponentName)}</strong>
          ) : target ? (
            <strong>
              {target.card.name} ({outcome?.guard ?? target.resistance})
            </strong>
          ) : (
            <span className={attacker ? 'is-action' : 'is-muted'}>
              {attacker ? t.board.pickInTheirArena : t.board.afterAttacker}
            </span>
          )}
        </span>
      </div>
      {effects.length > 0 && (
        <ul className="board-effects" aria-label={t.board.attackResult}>
          {effects.map((e) => (
            <li key={e.text} className={`is-${e.tone}`}>
              {e.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ZoneLabel({ tone, children }: { tone?: 'action' | 'target'; children: ReactNode }) {
  return <span className={`board-zone-label${tone ? ` is-${tone}` : ''}`}>{children}</span>
}

/** Open arena positions, so the 3-character limit is visible; `incoming` previews the picked card. */
function EmptySlots({ count, incoming }: { count: number; incoming?: string }) {
  const { t } = useI18n()
  return Array.from({ length: Math.max(0, count) }, (_, i) =>
    i === 0 && incoming !== undefined ? (
      <div key={i} className="board-slot is-incoming">
        <PlusIcon size={22} />
        <span>{incoming ? t.board.incoming(incoming) : t.board.yourCardHere}</span>
      </div>
    ) : (
      <div key={i} className="board-slot">
        {t.board.freeSlot}
      </div>
    ),
  )
}

type PlayerBarProps = {
  name: string
  initials: string
  team: Team
  life: number
  /** Life the pending attack would take away, shown on the bar. */
  lifeLoss?: number
  extra: string
  status?: { label: string; tone: 'idle' | 'done' | 'alert' }
}

function PlayerBar({ name, initials, team, life, lifeLoss = 0, extra, status }: PlayerBarProps) {
  const { t } = useI18n()
  const loss = Math.min(life, lifeLoss)
  return (
    <div className="board-player">
      <div className="board-player-id">
        <span className={`board-avatar board-avatar-${team}`}>{initials}</span>
        <span>
          <strong>{name}</strong>
          <TeamBadge team={team} />
        </span>
      </div>
      <div className="board-life">
        <HeartIcon /> <strong>{life}</strong> / {START_LIFE} {t.board.life}
      </div>
      <div className={`board-life-bar board-life-bar-${team}`} aria-hidden="true">
        <span style={{ width: `${((life - loss) / START_LIFE) * 100}%` }} />
        {loss > 0 && <span className="is-loss" style={{ width: `${(loss / START_LIFE) * 100}%` }} />}
      </div>
      {loss > 0 && <span className="board-life-loss">{t.board.willLose(loss)}</span>}
      <span className="board-extra">{extra}</span>
      {status && <span className={`board-status-chip is-${status.tone}`}>{status.label}</span>}
    </div>
  )
}
