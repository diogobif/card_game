import type { Team } from './player.ts'
import data from './data/cards.json' with { type: 'json' }

export const CATEGORIES = [
  'influenciador',
  'militante',
  'empresario',
  'intelectual',
  'politico',
  'burocrata',
  'militar',
  'religioso',
] as const

export type Category = (typeof CATEGORIES)[number]

export type Stat = 'attack' | 'resistance'

export type CharacterCard = {
  id: string
  name: string
  category: Category
  team: Team
  attack: number
  resistance: number
  image: string
}

export type StatModifier = {
  category: Category
  stat: Stat
  /** Always positive: a boost adds it, a penalty subtracts it. */
  amount: number
}

export type SupportCard = {
  id: string
  name: string
  team: Team
  image: string
  boost: StatModifier
  penalty: StatModifier
}

export type Arena = {
  id: string
  name: string
  // null for the neutral arena.
  favors: Team | null
  image: string
}

type CardData = {
  characters: CharacterCard[]
  supports: SupportCard[]
  arenas: Arena[]
}

// Test data in shared/data/cards.json; JSON infers plain strings, so narrow the literal fields here.
const cards = data as CardData

export const CHARACTERS: readonly CharacterCard[] = cards.characters
export const SUPPORTS: readonly SupportCard[] = cards.supports
export const ARENAS: readonly Arena[] = cards.arenas
