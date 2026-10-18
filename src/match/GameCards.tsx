import type { CharacterCard, SupportCard } from '../../shared/cards.ts'
import { CATEGORY_LABELS, describeModifier } from './labels.ts'

type CardProps = {
  card: CharacterCard
  /** Current stats when on the field; defaults to the printed ones. */
  attack?: number
  resistance?: number
  selected?: boolean
  onSelect?: () => void
}

export function CharacterCardView({ card, attack, resistance, selected, onSelect }: CardProps) {
  const atk = attack ?? card.attack
  const res = resistance ?? card.resistance
  const className = `game-card game-card-${card.team}${selected ? ' is-selected' : ''}`
  const body = (
    <>
      <img src={card.image} alt="" loading="lazy" />
      <span className="game-card-name">{card.name}</span>
      <span className="game-card-meta">
        {CATEGORY_LABELS[card.category]}
        {card.special && <strong> · Especial</strong>}
      </span>
      <span className="game-card-stats">
        <span title="Força" className={statClass(atk, card.attack)}>⚔ {atk}</span>
        <span title="Resistência" className={statClass(res, card.resistance)}>🛡 {res}</span>
      </span>
    </>
  )
  if (!onSelect) return <div className={className}>{body}</div>
  return (
    <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
      {body}
    </button>
  )
}

function statClass(current: number, base: number): string {
  if (current > base) return 'stat-up'
  if (current < base) return 'stat-down'
  return ''
}

export function SupportCardView({ card }: { card: SupportCard }) {
  return (
    <div className={`game-card game-card-support game-card-${card.team}`}>
      <img src={card.image} alt="" loading="lazy" />
      <span className="game-card-name">{card.name}</span>
      <span className="game-card-meta stat-up">Seus: {describeModifier(card.boost, '+')}</span>
      <span className="game-card-meta stat-down">Rival: {describeModifier(card.penalty, '−')}</span>
    </div>
  )
}
