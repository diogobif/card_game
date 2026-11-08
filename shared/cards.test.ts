// The card list must follow the game rules (see CLAUDE.md), whatever the placeholder data is.
import { describe, expect, it } from 'vitest'
import { ARENAS, CHARACTERS, SUPPORTS } from './cards.ts'
import { TEAMS } from './player.ts'

describe('card data', () => {
  it.each(TEAMS)('team %s has 20 characters and 5 supports', (team) => {
    expect(CHARACTERS.filter((c) => c.team === team)).toHaveLength(20)
    expect(SUPPORTS.filter((s) => s.team === team)).toHaveLength(5)
  })

  it('character stats are between 1 and 10', () => {
    for (const c of CHARACTERS) {
      expect(c.attack, c.id).toBeGreaterThanOrEqual(1)
      expect(c.attack, c.id).toBeLessThanOrEqual(10)
      expect(c.resistance, c.id).toBeGreaterThanOrEqual(1)
      expect(c.resistance, c.id).toBeLessThanOrEqual(10)
    }
  })

  it('every card id is unique', () => {
    const ids = [...CHARACTERS, ...SUPPORTS, ...ARENAS].map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('support effects change a positive number of points', () => {
    for (const s of SUPPORTS) {
      expect(s.boost.amount, s.id).toBeGreaterThan(0)
      expect(s.penalty.amount, s.id).toBeGreaterThan(0)
    }
  })

  it('has 5 arenas: one neutral and two favoring each team', () => {
    expect(ARENAS).toHaveLength(5)
    expect(ARENAS.filter((a) => a.favors === null)).toHaveLength(1)
    for (const team of TEAMS) expect(ARENAS.filter((a) => a.favors === team)).toHaveLength(2)
  })
})
