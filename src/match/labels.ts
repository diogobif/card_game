import type { Category, Stat, StatModifier } from '../../shared/cards.ts'
import { MAX_TURNS, type GameEndReason } from '../../shared/game.ts'

export const CATEGORY_LABELS: Record<Category, string> = {
  influenciador: 'Influenciador',
  militante: 'Militante',
  empresario: 'Empresário',
  intelectual: 'Intelectual',
  politico: 'Político',
  burocrata: 'Burocrata',
  militar: 'Militar',
  religioso: 'Religioso',
}

export const STAT_LABELS: Record<Stat, string> = {
  attack: 'força',
  resistance: 'resistência',
}

export const END_REASON_LABELS: Record<GameEndReason, string> = {
  life: 'Os pontos de vida chegaram a zero.',
  specials: 'As 5 cartas especiais de um time foram reunidas.',
  'no-cards': 'As cartas acabaram; vence quem tem mais pontos de vida.',
  'turn-limit': `Fim dos ${MAX_TURNS} turnos; vence quem tem mais pontos de vida.`,
  forfeit: 'Um jogador desistiu da partida.',
  disconnect: 'Um jogador ficou desconectado por mais de 60 segundos.',
}

export function describeModifier(mod: StatModifier, sign: '+' | '−'): string {
  return `${sign}${mod.amount} de ${STAT_LABELS[mod.stat]} (${CATEGORY_LABELS[mod.category]})`
}
