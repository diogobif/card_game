import { describe, expect, it } from 'vitest'
import type { Category, CharacterCard, StatModifier, SupportCard } from './cards.ts'
import { resolveAttack, supportModifier } from './combat.ts'
import type { FieldCard, PlayedSupport } from './game.ts'

function field(attack: number, resistance: number, category: Category = 'militante'): FieldCard {
  const card: CharacterCard = {
    id: `${category}-${attack}-${resistance}`,
    name: 'Teste',
    category,
    team: 'red',
    attack,
    resistance,
    image: '',
  }
  return { card, attack, resistance, placedTurn: 1 }
}

function support(boost: StatModifier, penalty: StatModifier): SupportCard {
  return { id: 'sup', name: 'Suporte', team: 'red', image: '', boost, penalty }
}

const NO_EFFECT: StatModifier = { category: 'religioso', stat: 'attack', amount: 9 }

describe('resolveAttack without supports', () => {
  it('matches the rules example: strength 10 against resistance 5', () => {
    const outcome = resolveAttack([], 'a', field(10, 3), 'b', field(2, 5))
    expect(outcome).toEqual({
      power: 10,
      guard: 5,
      attackerAttack: 5, // loses strength equal to the target's resistance
      targetResistance: null, // target leaves the arena
      lifeDamage: 5, // leftover goes to the defending player
    })
  })

  it('removes both cards when strength equals resistance, with no life damage', () => {
    const outcome = resolveAttack([], 'a', field(5, 5), 'b', field(5, 5))
    expect(outcome.attackerAttack).toBeNull()
    expect(outcome.targetResistance).toBeNull()
    expect(outcome.lifeDamage).toBe(0)
  })

  it('a weaker attacker leaves the arena and only wears the target down', () => {
    const outcome = resolveAttack([], 'a', field(3, 8), 'b', field(4, 7))
    expect(outcome.attackerAttack).toBeNull()
    expect(outcome.targetResistance).toBe(4)
    expect(outcome.lifeDamage).toBe(0)
  })

  it('a direct attack deals full strength to life and keeps the attacker unchanged', () => {
    const outcome = resolveAttack([], 'a', field(7, 2), 'b', null)
    expect(outcome).toEqual({ power: 7, guard: null, attackerAttack: 7, targetResistance: null, lifeDamage: 7 })
  })
})

describe('supportModifier', () => {
  const played: PlayedSupport[] = [
    {
      playerId: 'a',
      support: support(
        { category: 'militante', stat: 'attack', amount: 2 },
        { category: 'politico', stat: 'resistance', amount: 3 },
      ),
    },
  ]

  it("adds the owner's boost to matching category and stat", () => {
    expect(supportModifier(played, 'a', field(4, 4, 'militante'), 'attack')).toBe(2)
  })

  it("subtracts the opponent's penalty", () => {
    expect(supportModifier(played, 'b', field(4, 4, 'politico'), 'resistance')).toBe(-3)
  })

  it('ignores other categories and stats', () => {
    expect(supportModifier(played, 'a', field(4, 4, 'militante'), 'resistance')).toBe(0)
    expect(supportModifier(played, 'a', field(4, 4, 'politico'), 'attack')).toBe(0)
    // A player's own penalty never hits their own cards.
    expect(supportModifier(played, 'a', field(4, 4, 'politico'), 'resistance')).toBe(0)
  })
})

describe('resolveAttack with supports', () => {
  it('a boost raises power and absorbs the strength lost in the hit', () => {
    const played: PlayedSupport[] = [
      { playerId: 'a', support: support({ category: 'militante', stat: 'attack', amount: 2 }, NO_EFFECT) },
    ]
    const outcome = resolveAttack(played, 'a', field(4, 4, 'militante'), 'b', field(1, 3, 'politico'))
    expect(outcome.power).toBe(6)
    expect(outcome.lifeDamage).toBe(3)
    // Lost 3 strength, but the +2 boost took the first 2 of it.
    expect(outcome.attackerAttack).toBe(3)
  })

  it("the attacker's penalty lowers the target's resistance for this turn", () => {
    const played: PlayedSupport[] = [
      { playerId: 'a', support: support(NO_EFFECT, { category: 'politico', stat: 'resistance', amount: 2 }) },
    ]
    const outcome = resolveAttack(played, 'a', field(5, 4, 'militante'), 'b', field(1, 6, 'politico'))
    expect(outcome.guard).toBe(4)
    expect(outcome.targetResistance).toBeNull()
    expect(outcome.lifeDamage).toBe(1)
  })

  it('power never goes below zero', () => {
    const played: PlayedSupport[] = [
      { playerId: 'b', support: support(NO_EFFECT, { category: 'militante', stat: 'attack', amount: 3 }) },
    ]
    const outcome = resolveAttack(played, 'a', field(1, 4, 'militante'), 'b', null)
    expect(outcome.power).toBe(0)
    expect(outcome.lifeDamage).toBe(0)
  })
})
