import type { Stat } from './cards.ts'
import type { FieldCard, PlayedSupport } from './game.ts'

/** This turn's support bonus on a card: its owner's boosts plus the opponent's reductions. */
export function supportModifier(
  turnSupports: readonly PlayedSupport[],
  ownerId: string,
  card: FieldCard,
  stat: Stat,
): number {
  let total = 0
  for (const { playerId, support } of turnSupports) {
    const mine = playerId === ownerId
    const effect = mine ? support.boost : support.penalty
    if (effect.category === card.card.category && effect.stat === stat) {
      total += mine ? effect.amount : -effect.amount
    }
  }
  return total
}

export type AttackOutcome = {
  /** Attacker's strength this turn, supports included. */
  power: number
  /** Target's resistance this turn, supports included; null on a direct attack. */
  guard: number | null
  /** Attacker's strength afterwards; null when it leaves the arena. */
  attackerAttack: number | null
  /** Target's resistance afterwards; null when it leaves the arena (or there is no target). */
  targetResistance: number | null
  /** Damage dealt to the defending player's life points. */
  lifeDamage: number
}

/** Resolves an attack without changing anything; the server applies it and the client previews it. */
export function resolveAttack(
  turnSupports: readonly PlayedSupport[],
  attackerOwnerId: string,
  attacker: FieldCard,
  defenderId: string,
  target: FieldCard | null,
): AttackOutcome {
  const atkMod = supportModifier(turnSupports, attackerOwnerId, attacker, 'attack')
  const power = Math.max(0, attacker.attack + atkMod)
  // Direct attacks on life points are only allowed against an empty arena.
  if (!target) {
    return { power, guard: null, attackerAttack: attacker.attack, targetResistance: null, lifeDamage: power }
  }
  const resMod = supportModifier(turnSupports, defenderId, target, 'resistance')
  const guard = Math.max(0, target.resistance + resMod)
  return {
    power,
    guard,
    // The attacker loses strength equal to the target's resistance.
    attackerAttack: power - guard > 0 ? afterHit(attacker.attack, atkMod, guard) : null,
    targetResistance: guard - power > 0 ? afterHit(target.resistance, resMod, power) : null,
    // Leftover damage goes straight to the defending player's life points.
    lifeDamage: Math.max(0, power - guard),
  }
}

// A temporary support boost absorbs the hit first; a temporary reduction doesn't linger.
function afterHit(current: number, mod: number, damage: number): number {
  return current - Math.max(0, damage - Math.max(0, mod))
}
