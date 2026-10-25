import type { Arena, CharacterCard, SupportCard } from './cards.ts'
import type { Player } from './player.ts'

export const HAND_SIZE = 5
// A player with this many characters in the arena skips placing a card that turn.
export const MAX_FIELD = 3
export const START_LIFE = 20
export const TURN_TIME_MS = 60_000
// After this many turns the player with more life wins.
export const MAX_TURNS = 20
// Bonus to attack and resistance for characters of the team an arena favors.
export const ARENA_BONUS = 1

/** A character placed in the arena. Stats include the arena bonus and any damage taken. */
export type FieldCard = {
  card: CharacterCard
  attack: number
  resistance: number
  placedTurn: number
}

/** 'choose': both players pick a card. 'attack': the attacker picks who attacks whom. */
export type GamePhase = 'choose' | 'attack' | 'over'

export type GameEndReason =
  | 'life'
  | 'no-cards'
  | 'turn-limit'
  | 'forfeit'
  | 'disconnect'

export type GameResult = {
  /** null on a draw. */
  winnerId: string | null
  reason: GameEndReason
}

export type PlayedSupport = { playerId: string; support: SupportCard }

export type SelfView = {
  player: Player
  life: number
  deckCount: number
  hand: CharacterCard[]
  support: SupportCard
  supportUsed: boolean
  field: FieldCard[]
  hasChosen: boolean
}

export type OpponentView = {
  player: Player
  life: number
  deckCount: number
  handCount: number
  supportUsed: boolean
  field: FieldCard[]
  hasChosen: boolean
}

/** What the last attack did, so clients can animate it. Card stats are taken before the hit. */
export type AttackEvent = {
  /** Increases with every attack in the match; clients animate each id once. */
  id: number
  turn: number
  attackerPlayerId: string
  defenderPlayerId: string
  attacker: FieldCard
  /** null on a direct attack on life points. */
  target: FieldCard | null
  power: number
  guard: number | null
  /** Stats after the hit; null when that card left the arena. */
  attackerAttackAfter: number | null
  targetResistanceAfter: number | null
  lifeDamage: number
  defenderLifeAfter: number
}

/** One player's view of a match: the opponent's hand and unused support stay hidden. */
export type GameView = {
  matchId: string
  arena: Arena
  turn: number
  phase: GamePhase
  /** Time left in the current phase when this view was sent. */
  timeLeftMs: number
  attackerId: string | null
  me: SelfView
  opponent: OpponentView
  /** Support cards played this turn; their effects last until the turn ends. */
  turnSupports: PlayedSupport[]
  log: string[]
  result: GameResult | null
  lastAttack: AttackEvent | null
}
