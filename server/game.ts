import {
  ARENAS,
  CHARACTERS,
  SUPPORTS,
  type Arena,
  type CharacterCard,
  type SupportCard,
} from '../shared/cards.ts'
import { resolveAttack } from '../shared/combat.ts'
import {
  ARENA_BONUS,
  HAND_SIZE,
  MAX_FIELD,
  MAX_TURNS,
  START_LIFE,
  TURN_TIME_MS,
  type AttackEvent,
  type FieldCard,
  type GamePhase,
  type GameResult,
  type GameView,
  type PlayedSupport,
} from '../shared/game.ts'
import type { Player } from '../shared/player.ts'

const LOG_SIZE = 12

type PlayerState = {
  player: Player
  life: number
  /** Each player draws only from their own team's characters. */
  deck: CharacterCard[]
  hand: CharacterCard[]
  support: SupportCard
  supportUsed: boolean
  field: FieldCard[]
  choice: { card: CharacterCard; useSupport: boolean } | null
}

export type Game = {
  matchId: string
  arena: Arena
  players: [PlayerState, PlayerState]
  turn: number
  phase: GamePhase
  deadline: number
  timer: ReturnType<typeof setTimeout> | undefined
  attacker: 0 | 1 | null
  turnSupports: PlayedSupport[]
  log: string[]
  result: GameResult | null
  lastAttack: AttackEvent | null
  /** Called after every state change, so the server can push fresh views. */
  onUpdate: (game: Game) => void
}

export function createGame(matchId: string, players: Player[], onUpdate: (game: Game) => void): Game {
  // Players on the same team each get their own copy of that team's cards.
  const makePlayer = (player: Player): PlayerState => {
    const deck = shuffle(CHARACTERS.filter((c) => c.team === player.team))
    const supports = SUPPORTS.filter((s) => s.team === player.team)
    return {
      player,
      life: START_LIFE,
      deck,
      hand: deck.splice(0, HAND_SIZE),
      support: supports[Math.floor(Math.random() * supports.length)],
      supportUsed: false,
      field: [],
      choice: null,
    }
  }
  const game: Game = {
    matchId,
    arena: ARENAS[Math.floor(Math.random() * ARENAS.length)],
    players: [makePlayer(players[0]), makePlayer(players[1])],
    turn: 0,
    phase: 'choose',
    deadline: 0,
    timer: undefined,
    attacker: null,
    turnSupports: [],
    log: [],
    result: null,
    lastAttack: null,
    onUpdate,
  }
  addLog(game, `Arena: ${game.arena.name}.`)
  startChoosePhase(game)
  return game
}

export function disposeGame(game: Game) {
  clearTimeout(game.timer)
}

export function playCard(game: Game, playerId: string, cardId: string, useSupport: boolean) {
  if (game.phase !== 'choose') return
  const p = game.players.find((s) => s.player.id === playerId)
  if (!p || p.choice || !canPlay(p)) return
  const card = p.hand.find((c) => c.id === cardId)
  if (!card) return
  p.choice = { card, useSupport: useSupport && !p.supportUsed }
  if (game.players.every((s) => s.choice || !canPlay(s))) reveal(game)
  else game.onUpdate(game)
}

/** The player gives up (or stayed offline too long) and loses; the opponent wins. */
export function forfeit(
  game: Game,
  playerId: string,
  reason: 'forfeit' | 'disconnect' = 'forfeit',
) {
  if (game.phase === 'over') return
  const loser = game.players.find((p) => p.player.id === playerId)
  const winner = game.players.find((p) => p.player.id !== playerId)
  if (!loser || !winner) return
  addLog(
    game,
    reason === 'forfeit'
      ? `${loser.player.name} desistiu da partida.`
      : `${loser.player.name} perdeu a partida por desconexão.`,
  )
  endGame(game, { winnerId: winner.player.id, reason })
}

export function attack(
  game: Game,
  playerId: string,
  attackerCardId: string,
  targetCardId: string | null,
) {
  if (game.phase !== 'attack' || game.attacker === null) return
  const me = game.players[game.attacker]
  const foe = game.players[1 - game.attacker]
  if (me.player.id !== playerId) return
  const attacker = me.field.find((f) => f.card.id === attackerCardId)
  if (!attacker) return
  const target = targetCardId === null ? null : foe.field.find((f) => f.card.id === targetCardId)
  // Direct attacks on life points are only allowed against an empty arena.
  if (target === undefined || (target === null && foe.field.length > 0)) return

  const outcome = resolveAttack(game.turnSupports, me.player.id, attacker, foe.player.id, target)
  // Snapshot before the hit changes the cards.
  const before = { attacker: { ...attacker }, target: target && { ...target } }

  if (!target) {
    damageLife(foe, outcome.lifeDamage)
    addLog(game, `${attacker.card.name} atacou ${foe.player.name} diretamente (${outcome.power} de dano).`)
  } else {
    addLog(game, `${attacker.card.name} (${outcome.power}) atacou ${target.card.name} (${outcome.guard}).`)
    if (outcome.attackerAttack === null) removeFromField(game, me, attacker)
    else attacker.attack = outcome.attackerAttack
    if (outcome.targetResistance === null) removeFromField(game, foe, target)
    else target.resistance = outcome.targetResistance
    if (outcome.lifeDamage > 0) {
      damageLife(foe, outcome.lifeDamage)
      addLog(game, `${outcome.lifeDamage} de dano excedente em ${foe.player.name}.`)
    }
  }

  game.lastAttack = {
    id: (game.lastAttack?.id ?? 0) + 1,
    turn: game.turn,
    attackerPlayerId: me.player.id,
    defenderPlayerId: foe.player.id,
    attacker: before.attacker,
    target: before.target,
    power: outcome.power,
    guard: outcome.guard,
    attackerAttackAfter: outcome.attackerAttack,
    targetResistanceAfter: outcome.targetResistance,
    lifeDamage: outcome.lifeDamage,
    defenderLifeAfter: foe.life,
  }

  if (foe.life <= 0) endGame(game, { winnerId: me.player.id, reason: 'life' })
  else startChoosePhase(game)
}

function removeFromField(game: Game, owner: PlayerState, card: FieldCard) {
  owner.field = owner.field.filter((f) => f !== card)
  addLog(game, `${card.card.name} saiu da arena.`)
}

function damageLife(p: PlayerState, amount: number) {
  p.life = Math.max(0, p.life - amount)
}

function startChoosePhase(game: Game) {
  const [a, b] = game.players
  // Both endings below go to whoever has more life; equal life is a draw.
  const reason =
    game.turn >= MAX_TURNS
      ? 'turn-limit'
      : a.hand.length === 0 && b.hand.length === 0
        ? 'no-cards'
        : null
  if (reason) {
    const winnerId = a.life === b.life ? null : a.life > b.life ? a.player.id : b.player.id
    endGame(game, { winnerId, reason })
    return
  }
  game.turn++
  game.phase = 'choose'
  game.turnSupports = []
  for (const p of game.players) p.choice = null
  setPhaseTimer(game, () => {
    for (const p of game.players) {
      if (!p.choice && canPlay(p)) {
        const card = p.hand[Math.floor(Math.random() * p.hand.length)]
        p.choice = { card, useSupport: false }
        addLog(game, `${p.player.name} não escolheu a tempo; carta aleatória.`)
      }
    }
    reveal(game)
  })
  // Both arenas full: nobody places a card, go straight to the attack.
  if (!game.players.some(canPlay)) {
    addLog(game, 'As duas arenas estão cheias; nenhuma carta foi jogada.')
    reveal(game)
    return
  }
  game.onUpdate(game)
}

function canPlay(p: PlayerState): boolean {
  return p.hand.length > 0 && p.field.length < MAX_FIELD
}

function reveal(game: Game) {
  const played: (FieldCard | null)[] = []
  const specialPlayers: PlayerState[] = []
  for (const p of game.players) {
    const choice = p.choice
    if (!choice) {
      played.push(null)
      continue
    }
    p.hand = p.hand.filter((c) => c !== choice.card)
    const bonus = game.arena.favors === choice.card.team ? ARENA_BONUS : 0
    const placed: FieldCard = {
      card: choice.card,
      attack: choice.card.attack + bonus,
      resistance: choice.card.resistance + bonus,
      placedTurn: game.turn,
    }
    p.field.push(placed)
    played.push(placed)
    addLog(game, `${p.player.name} jogou ${choice.card.name}.`)
    if (choice.card.special) specialPlayers.push(p)
    if (choice.useSupport) {
      p.supportUsed = true
      game.turnSupports.push({ playerId: p.player.id, support: p.support })
      addLog(game, `${p.player.name} usou o suporte ${p.support.name}.`)
    }
    const drawn = p.deck.shift()
    if (drawn) p.hand.push(drawn)
  }
  // A revealed special clears the opponent's arena, including the card they just played.
  // Cards are placed first, so two specials in the same turn clear both arenas.
  for (const p of specialPlayers) {
    const foe = game.players.find((s) => s !== p)!
    if (foe.field.length === 0) continue
    foe.field = []
    addLog(game, `Carta especial de ${p.player.name} limpou a arena de ${foe.player.name}!`)
  }

  if (game.attacker === null) {
    // First attack goes to whoever revealed the stronger card; ties are random.
    const [a, b] = played.map((f) => (f ? f.attack : -1))
    game.attacker = a > b ? 0 : b > a ? 1 : Math.random() < 0.5 ? 0 : 1
  } else {
    game.attacker = game.attacker === 0 ? 1 : 0
  }

  const attacker = game.players[game.attacker]
  if (attacker.field.length === 0) {
    addLog(game, `${attacker.player.name} não tem personagens para atacar.`)
    startChoosePhase(game)
    return
  }
  game.phase = 'attack'
  setPhaseTimer(game, () => {
    addLog(game, `${attacker.player.name} não atacou a tempo.`)
    startChoosePhase(game)
  })
  game.onUpdate(game)
}

function endGame(game: Game, result: GameResult) {
  clearTimeout(game.timer)
  game.phase = 'over'
  game.result = result
  game.onUpdate(game)
}

function setPhaseTimer(game: Game, onTimeout: () => void) {
  clearTimeout(game.timer)
  game.deadline = Date.now() + TURN_TIME_MS
  game.timer = setTimeout(onTimeout, TURN_TIME_MS)
}

function addLog(game: Game, line: string) {
  game.log.push(line)
  if (game.log.length > LOG_SIZE) game.log.shift()
}

export function viewFor(game: Game, playerId: string): GameView {
  const meIndex = game.players[0].player.id === playerId ? 0 : 1
  const me = game.players[meIndex]
  const foe = game.players[1 - meIndex]
  return {
    matchId: game.matchId,
    arena: game.arena,
    turn: game.turn,
    phase: game.phase,
    timeLeftMs: game.phase === 'over' ? 0 : Math.max(0, game.deadline - Date.now()),
    attackerId: game.attacker === null ? null : game.players[game.attacker].player.id,
    me: {
      player: me.player,
      life: me.life,
      deckCount: me.deck.length,
      hand: me.hand,
      support: me.support,
      supportUsed: me.supportUsed,
      field: me.field,
      hasChosen: me.choice !== null,
    },
    opponent: {
      player: foe.player,
      life: foe.life,
      deckCount: foe.deck.length,
      handCount: foe.hand.length,
      supportUsed: foe.supportUsed,
      field: foe.field,
      hasChosen: foe.choice !== null,
    },
    turnSupports: game.turnSupports,
    log: game.log,
    result: game.result,
    lastAttack: game.lastAttack,
  }
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}
