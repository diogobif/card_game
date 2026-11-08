import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ARENAS, CHARACTERS, type CharacterCard, type Arena } from '../shared/cards.ts'
import { HAND_SIZE, MAX_FIELD, MAX_TURNS, START_LIFE, TURN_TIME_MS, type FieldCard } from '../shared/game.ts'
import type { Player, Team } from '../shared/player.ts'
import { attack, createGame, disposeGame, forfeit, playCard, viewFor, type Game } from './game.ts'

const ANA: Player = { id: 'ana', name: 'Ana', team: 'red' }
const BIA: Player = { id: 'bia', name: 'Bia', team: 'blue' }
const NEUTRAL = ARENAS.find((a) => a.favors === null) as Arena

let nextId = 0
function card(team: Team, attack: number, resistance: number): CharacterCard {
  return { id: `card-${++nextId}`, name: `Carta ${nextId}`, category: 'militante', team, attack, resistance, image: '' }
}

function onField(c: CharacterCard): FieldCard {
  return { card: c, attack: c.attack, resistance: c.resistance, placedTurn: 0 }
}

let game: Game
const games: Game[] = []

/** A new match in the neutral arena, with each player's first hand card set to the given card. */
function start(first?: { ana?: CharacterCard; bia?: CharacterCard }, players: [Player, Player] = [ANA, BIA]): Game {
  const g = createGame('m1', players, () => {})
  games.push(g)
  g.arena = NEUTRAL
  if (first?.ana) g.players[0].hand[0] = first.ana
  if (first?.bia) g.players[1].hand[0] = first.bia
  return g
}

/** Both players reveal a card; returns the cards played. */
function playTurn(g: Game, anaCard = g.players[0].hand[0], biaCard = g.players[1].hand[0]) {
  playCard(g, ANA.id, anaCard.id, false)
  playCard(g, BIA.id, biaCard.id, false)
  return { anaCard, biaCard }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  for (const g of games.splice(0)) disposeGame(g)
  vi.useRealTimers()
})

describe('createGame', () => {
  it('deals 5 cards from the player own team deck, 20 life and one team support', () => {
    game = start()
    for (const p of game.players) {
      expect(p.life).toBe(START_LIFE)
      expect(p.hand).toHaveLength(HAND_SIZE)
      expect(p.deck).toHaveLength(20 - HAND_SIZE)
      expect([...p.hand, ...p.deck].every((c) => c.team === p.player.team)).toBe(true)
      expect(p.support.team).toBe(p.player.team)
      expect(p.supportUsed).toBe(false)
      expect(p.field).toEqual([])
    }
    expect(game.turn).toBe(1)
    expect(game.phase).toBe('choose')
  })

  it('gives players on the same team their own copy of the deck', () => {
    game = start(undefined, [ANA, { ...BIA, team: 'red' }])
    const [a, b] = game.players
    expect([...a.hand, ...a.deck]).toHaveLength(20)
    expect([...b.hand, ...b.deck]).toHaveLength(20)
    expect(a.deck).not.toBe(b.deck)
    expect([...b.hand, ...b.deck].every((c) => c.team === 'red')).toBe(true)
  })
})

describe('choose phase', () => {
  it('waits for both players, then reveals and refills the hands from the deck', () => {
    game = start()
    const anaCard = game.players[0].hand[0]
    playCard(game, ANA.id, anaCard.id, false)
    expect(game.phase).toBe('choose')
    expect(game.players[0].field).toEqual([])

    playTurn(game, anaCard, game.players[1].hand[0])
    for (const p of game.players) {
      expect(p.field).toHaveLength(1)
      expect(p.hand).toHaveLength(HAND_SIZE)
      expect(p.deck).toHaveLength(20 - HAND_SIZE - 1)
    }
    expect(game.players[0].field[0].card).toBe(anaCard)
    expect(game.players[0].hand).not.toContain(anaCard)
  })

  it('ignores a card that is not in the player hand', () => {
    game = start()
    playCard(game, ANA.id, CHARACTERS.find((c) => c.team === 'blue')!.id, false)
    expect(viewFor(game, ANA.id).me.hasChosen).toBe(false)
  })

  it('gives the first attack to the stronger revealed card', () => {
    game = start({ ana: card('red', 3, 5), bia: card('blue', 8, 5) })
    playTurn(game)
    expect(game.phase).toBe('attack')
    expect(viewFor(game, ANA.id).attackerId).toBe(BIA.id)
  })

  it('adds 1 attack and 1 resistance to characters of the team the arena favors', () => {
    game = start({ ana: card('red', 4, 6), bia: card('blue', 4, 6) })
    game.arena = ARENAS.find((a) => a.favors === 'red') as Arena
    playTurn(game)
    expect(game.players[0].field[0]).toMatchObject({ attack: 5, resistance: 7 })
    expect(game.players[1].field[0]).toMatchObject({ attack: 4, resistance: 6 })
  })

  it('plays a random card for a player who does not choose in 60 seconds', () => {
    game = start()
    playCard(game, ANA.id, game.players[0].hand[0].id, false)
    vi.advanceTimersByTime(TURN_TIME_MS)
    expect(game.players[1].field).toHaveLength(1)
    expect(game.log.some((l) => l.includes('Bia não escolheu a tempo'))).toBe(true)
  })

  it('a player with 3 characters in the arena keeps their hand and the turn goes on', () => {
    game = start({ bia: card('blue', 2, 2) })
    game.players[0].field = [onField(card('red', 1, 9)), onField(card('red', 1, 9)), onField(card('red', 1, 9))]
    const anaHand = [...game.players[0].hand]

    playCard(game, BIA.id, game.players[1].hand[0].id, false)
    expect(game.players[0].field).toHaveLength(MAX_FIELD)
    expect(game.players[0].hand).toEqual(anaHand)
    expect(game.players[1].field).toHaveLength(1)
    expect(game.phase).toBe('attack')
  })
})

describe('support card', () => {
  it('is revealed with the character and can only be used once per match', () => {
    game = start({ ana: card('red', 9, 9), bia: card('blue', 1, 1) })
    playCard(game, ANA.id, game.players[0].hand[0].id, true)
    playCard(game, BIA.id, game.players[1].hand[0].id, false)
    expect(game.players[0].supportUsed).toBe(true)
    expect(game.turnSupports).toEqual([{ playerId: ANA.id, support: game.players[0].support }])

    vi.advanceTimersByTime(TURN_TIME_MS) // Ana doesn't attack; turn 2 starts
    expect(game.turn).toBe(2)
    expect(game.turnSupports).toEqual([])
    playCard(game, ANA.id, game.players[0].hand[0].id, true)
    playCard(game, BIA.id, game.players[1].hand[0].id, false)
    expect(game.turnSupports).toEqual([])
  })
})

describe('attack phase', () => {
  it('applies the rules example: 10 strength against 5 resistance', () => {
    const striker = card('red', 10, 2)
    const victim = card('blue', 1, 5)
    game = start({ ana: striker, bia: victim })
    playTurn(game)

    attack(game, ANA.id, striker.id, victim.id)
    const [ana, bia] = game.players
    expect(ana.field[0]).toMatchObject({ card: striker, attack: 5 })
    expect(bia.field).toEqual([])
    expect(bia.life).toBe(START_LIFE - 5)
    expect(game.lastAttack).toMatchObject({ id: 1, power: 10, guard: 5, lifeDamage: 5, defenderLifeAfter: 15 })
    expect(game.phase).toBe('choose')
    expect(game.turn).toBe(2)
  })

  it('only the current attacker can attack', () => {
    const striker = card('red', 9, 2)
    const victim = card('blue', 1, 5)
    game = start({ ana: striker, bia: victim })
    playTurn(game)
    attack(game, BIA.id, victim.id, striker.id)
    expect(game.phase).toBe('attack')
    expect(game.lastAttack).toBeNull()
  })

  it('direct attacks are only allowed when the opponent arena is empty', () => {
    const striker = card('red', 9, 2)
    game = start({ ana: striker, bia: card('blue', 1, 5) })
    playTurn(game)

    attack(game, ANA.id, striker.id, null)
    expect(game.players[1].life).toBe(START_LIFE)
    expect(game.phase).toBe('attack')

    game.players[1].field = []
    attack(game, ANA.id, striker.id, null)
    expect(game.players[1].life).toBe(START_LIFE - 9)
    expect(game.players[0].field[0].attack).toBe(9)
  })

  it('the attacker alternates every turn', () => {
    game = start({ ana: card('red', 9, 9), bia: card('blue', 1, 1) })
    playTurn(game)
    expect(viewFor(game, ANA.id).attackerId).toBe(ANA.id)
    vi.advanceTimersByTime(TURN_TIME_MS)
    playTurn(game)
    expect(viewFor(game, ANA.id).attackerId).toBe(BIA.id)
  })

  it('moves on to the next turn when the attacker does not act in 60 seconds', () => {
    game = start()
    playTurn(game)
    vi.advanceTimersByTime(TURN_TIME_MS)
    expect(game.phase).toBe('choose')
    expect(game.turn).toBe(2)
    expect(game.log.some((l) => l.includes('não atacou a tempo'))).toBe(true)
  })
})

describe('end of the match', () => {
  it('ends when a player life reaches zero', () => {
    const striker = card('red', 9, 2)
    game = start({ ana: striker, bia: card('blue', 1, 5) })
    playTurn(game)
    game.players[1].field = []
    game.players[1].life = 4

    attack(game, ANA.id, striker.id, null)
    expect(game.players[1].life).toBe(0)
    expect(game.phase).toBe('over')
    expect(game.result).toEqual({ winnerId: ANA.id, reason: 'life' })
  })

  it('after the last turn the player with more life wins', () => {
    game = start()
    playTurn(game)
    game.turn = MAX_TURNS
    game.players[0].life = 7
    game.players[1].life = 12
    vi.advanceTimersByTime(TURN_TIME_MS)
    expect(game.result).toEqual({ winnerId: BIA.id, reason: 'turn-limit' })
  })

  it('equal life when both run out of cards is a draw', () => {
    game = start()
    playTurn(game)
    for (const p of game.players) {
      p.hand = []
      p.deck = []
      p.life = 10
    }
    vi.advanceTimersByTime(TURN_TIME_MS)
    expect(game.result).toEqual({ winnerId: null, reason: 'no-cards' })
  })

  it('a forfeit gives the win to the opponent, once', () => {
    game = start()
    forfeit(game, ANA.id)
    expect(game.result).toEqual({ winnerId: BIA.id, reason: 'forfeit' })
    forfeit(game, BIA.id, 'disconnect')
    expect(game.result).toEqual({ winnerId: BIA.id, reason: 'forfeit' })
  })

  it('ignores moves after the match is over', () => {
    game = start()
    forfeit(game, ANA.id)
    playCard(game, BIA.id, game.players[1].hand[0].id, false)
    expect(game.players[1].field).toEqual([])
  })
})

describe('viewFor', () => {
  it('hides the opponent hand and unused support', () => {
    game = start()
    playCard(game, ANA.id, game.players[0].hand[0].id, false)
    const view = viewFor(game, BIA.id)
    expect(view.me.player).toEqual(BIA)
    expect(view.me.hand).toHaveLength(HAND_SIZE)
    expect(view.opponent.player).toEqual(ANA)
    expect(view.opponent.handCount).toBe(HAND_SIZE)
    expect(view.opponent.hasChosen).toBe(true)
    expect(view.opponent).not.toHaveProperty('hand')
    expect(view.opponent).not.toHaveProperty('support')
    expect(view.opponent).not.toHaveProperty('deck')
  })
})
