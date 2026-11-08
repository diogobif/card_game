import { describe, expect, it } from 'vitest'
import { isPlayer } from './player.ts'

describe('isPlayer', () => {
  it('accepts a valid player, accents included', () => {
    expect(isPlayer({ id: 'abc', name: 'João', team: 'red' })).toBe(true)
    expect(isPlayer({ id: 'abc', name: 'Ana2', team: 'blue' })).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'player'],
    ['an empty id', { id: '', name: 'Ana', team: 'red' }],
    ['a too long id', { id: 'x'.repeat(65), name: 'Ana', team: 'red' }],
    ['a one-letter name', { id: 'abc', name: 'A', team: 'red' }],
    ['a name over 20 characters', { id: 'abc', name: 'A'.repeat(21), team: 'red' }],
    ['a name with spaces', { id: 'abc', name: 'Ana Maria', team: 'red' }],
    ['a name with symbols', { id: 'abc', name: 'Ana!', team: 'red' }],
    ['an unknown team', { id: 'abc', name: 'Ana', team: 'green' }],
  ])('rejects %s', (_label, data) => {
    expect(isPlayer(data)).toBe(false)
  })
})
