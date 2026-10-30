import type { CharacterCard, StatModifier, SupportCard } from '../../shared/cards.ts'
import { CheckIcon, ShieldIcon, SwordIcon } from './icons.tsx'
import { CATEGORY_LABELS, STAT_LABELS } from './labels.ts'
import './GameCards.css'

/**
 * How a card invites interaction. 'playable' and 'target' mark cards the player can click now;
 * 'selected' and 'targeted' are the picks; 'dim' cards are out of play for this step.
 */
export type CardState = 'idle' | 'playable' | 'selected' | 'target' | 'targeted' | 'dim'

type CardProps = {
  card: CharacterCard
  /** Current stats when on the field; defaults to the printed ones. */
  attack?: number
  resistance?: number
  state?: CardState
  /** Short label under the card, like "Selecionada" or "Alvo". */
  tag?: string
  onSelect?: () => void
}

export function CharacterCardView({
  card,
  attack,
  resistance,
  state = 'idle',
  tag,
  onSelect,
}: CardProps) {
  const atk = attack ?? card.attack
  const res = resistance ?? card.resistance
  const className = `game-card game-card-${card.team} is-${state}`
  const label = `${card.name}, força ${atk}, resistência ${res}`
  const body = (
    <>
      <span className="game-card-frame">
        <span className="game-card-inner">
          <span className="game-card-art">
            <img src={card.image} alt="" loading="lazy" />
            <span className="game-card-category">{CATEGORY_LABELS[card.category]}</span>
          </span>
          <span className="game-card-name">{card.name}</span>
          <span className="game-card-stats">
            <span className="game-card-stat is-atk" title="Força">
              <SwordIcon size={12} />
              <strong className={statClass(atk, card.attack)}>{atk}</strong>
              {atk !== card.attack && <s>{card.attack}</s>}
            </span>
            <span className="game-card-stat is-res" title="Resistência">
              {res !== card.resistance && <s>{card.resistance}</s>}
              <strong className={statClass(res, card.resistance)}>{res}</strong>
              <ShieldIcon size={12} />
            </span>
          </span>
        </span>
      </span>
      {state === 'selected' && (
        <span className="game-card-badge">
          <CheckIcon size={14} />
        </span>
      )}
      {tag && <span className="game-card-tag">{tag}</span>}
    </>
  )
  if (!onSelect) {
    return (
      <div className={className} role="img" aria-label={label}>
        {body}
      </div>
    )
  }
  const pressed = state === 'selected' || state === 'targeted'
  return (
    <button type="button" className={className} onClick={onSelect} aria-pressed={pressed} aria-label={label}>
      {body}
    </button>
  )
}

function statClass(current: number, base: number): string | undefined {
  if (current > base) return 'stat-up'
  if (current < base) return 'stat-down'
  return undefined
}

export function SupportCardView({ card, used, dim }: { card: SupportCard; used?: boolean; dim?: boolean }) {
  return (
    <div className={`support-card support-card-${card.team}${used ? ' is-used' : dim ? ' is-dim' : ''}`}>
      <span className="support-card-inner">
        <span className="support-card-kicker" title="Só pode ser usado uma vez por partida">Suporte · 1x</span>
        <span className="support-card-art">
          <img src={card.image} alt="" loading="lazy" />
        </span>
        <span className="support-card-name">{card.name}</span>
        <span className="support-card-effects">
          <Effect mod={card.boost} up />
          <Effect mod={card.penalty} />
        </span>
      </span>
      {used && <span className="support-card-stamp">Usado</span>}
    </div>
  )
}

function Effect({ mod, up }: { mod: StatModifier; up?: boolean }) {
  return (
    <span className={`support-effect ${up ? 'is-up' : 'is-down'}`}>
      <ArrowIcon up={up} />
      <span>
        <strong>
          {up ? '+' : '−'}
          {mod.amount} {STAT_LABELS[mod.stat]}
        </strong>
        <span>
          {up ? 'Seus' : 'Rival'}: {CATEGORY_LABELS[mod.category]}
        </span>
      </span>
    </span>
  )
}

function ArrowIcon({ up }: { up?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M5 12l7 7 7-7'} />
    </svg>
  )
}
