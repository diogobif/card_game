import { randomBytes } from 'node:crypto'
import { WebSocket, WebSocketServer } from 'ws'
import { isPlayer, type Player } from '../shared/player.ts'
import { attack, createGame, disposeGame, forfeit, playCard, viewFor, type Game } from './game.ts'
import {
  WS_PATH,
  type ClientMessage,
  type MatchInfo,
  type OnlineUser,
  type ServerMessage,
} from '../shared/protocol.ts'

const PORT = Number(process.env.PORT ?? 3001)
const MATCH_SIZE = 2
// How long a player may be offline (e.g. page reload) before their matches are dropped.
const OFFLINE_GRACE_MS = 60_000

// All state lives in memory by design: no database, nothing survives a restart.
// A player id may have several sockets (e.g. a duplicated browser tab).
const connections = new Map<WebSocket, Player | null>()
const matches = new Map<string, MatchInfo>()
const games = new Map<string, Game>()
const pendingInvites = new Set<string>()

const inviteKey = (fromId: string, toId: string) => `${fromId}>${toId}`

const wss = new WebSocketServer({ port: PORT, path: WS_PATH })

wss.on('connection', (socket) => {
  connections.set(socket, null)

  socket.on('message', (raw) => {
    let msg: ClientMessage
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (typeof msg !== 'object' || msg === null) return

    if (msg.type === 'hello') {
      handleHello(socket, msg.player)
      return
    }
    const player = connections.get(socket)
    if (player) handleMessage(socket, player, msg)
  })

  socket.on('close', () => {
    const player = connections.get(socket)
    connections.delete(socket)
    if (player && !isOnline(player.id)) handleOffline(player)
    broadcastUsers()
  })
})

console.log(`Game server listening on ws://localhost:${PORT}${WS_PATH}`)

function handleHello(socket: WebSocket, data: unknown) {
  if (!isPlayer(data)) {
    socket.close(1008, 'invalid player')
    return
  }
  connections.set(socket, { id: data.id, name: data.name.trim(), team: data.team })
  broadcastUsers()
  // A reconnecting player gets their game back without asking.
  for (const game of games.values()) {
    if (game.players.some((p) => p.player.id === data.id)) {
      send(socket, { type: 'game-state', state: viewFor(game, data.id) })
    }
  }
}

function handleMessage(socket: WebSocket, player: Player, msg: ClientMessage) {
  switch (msg.type) {
    case 'invite': {
      const target = findPlayer(msg.to)
      if (!target || target.id === player.id) return
      if (isInMatch(target.id) || isInMatch(player.id)) {
        send(socket, { type: 'invite-declined', by: target })
        return
      }
      pendingInvites.add(inviteKey(player.id, target.id))
      sendTo(target.id, { type: 'invite-received', from: player })
      return
    }

    case 'invite-response': {
      if (!pendingInvites.delete(inviteKey(msg.from, player.id))) return
      const inviter = findPlayer(msg.from)
      if (!inviter) return
      if (msg.accept && !isInMatch(inviter.id) && !isInMatch(player.id)) {
        startMatch(createMatch([inviter, player]))
      } else {
        sendTo(inviter.id, { type: 'invite-declined', by: player })
      }
      return
    }

    case 'create-link': {
      removeWaitingMatches(player.id)
      const match = createMatch([player])
      send(socket, { type: 'link-created', matchId: match.id })
      return
    }

    case 'join-match': {
      const match = matches.get(msg.matchId)
      if (!match) {
        send(socket, { type: 'match-error', matchId: msg.matchId, reason: 'not-found' })
        return
      }
      if (match.players.some((p) => p.id === player.id)) {
        // Rejoining (e.g. after a reload). The host opening their own link just waits.
        if (match.players.length === MATCH_SIZE) {
          send(socket, { type: 'match-start', match })
          const game = games.get(match.id)
          if (game) send(socket, { type: 'game-state', state: viewFor(game, player.id) })
        }
        return
      }
      if (match.players.length >= MATCH_SIZE) {
        send(socket, { type: 'match-error', matchId: match.id, reason: 'full' })
        return
      }
      match.players.push(player)
      startMatch(match)
      return
    }

    case 'leave-match': {
      const match = matches.get(msg.matchId)
      if (!match?.players.some((p) => p.id === player.id)) return
      // Leaving a running game is a forfeit; the game's end then closes the match.
      const game = games.get(match.id)
      if (game) forfeit(game, player.id)
      else endMatch(match)
      return
    }

    case 'play-card': {
      const game = games.get(msg.matchId)
      if (game) playCard(game, player.id, String(msg.cardId), msg.useSupport === true)
      return
    }

    case 'attack': {
      const game = games.get(msg.matchId)
      const target = msg.targetCardId === null ? null : String(msg.targetCardId)
      if (game) attack(game, player.id, String(msg.attackerCardId), target)
      return
    }
  }
}

function handleOffline(player: Player) {
  for (const key of pendingInvites) {
    const [fromId, toId] = key.split('>')
    if (fromId === player.id || toId === player.id) pendingInvites.delete(key)
  }
  setTimeout(() => {
    if (isOnline(player.id)) return
    for (const match of matches.values()) {
      if (!match.players.some((p) => p.id === player.id)) continue
      // Abandoning a running game loses it; a match still waiting for an opponent just closes.
      const game = games.get(match.id)
      if (game) forfeit(game, player.id, 'disconnect')
      else endMatch(match)
    }
  }, OFFLINE_GRACE_MS)
}

function createMatch(players: Player[]): MatchInfo {
  const match = { id: randomBytes(6).toString('base64url'), players }
  matches.set(match.id, match)
  return match
}

function startMatch(match: MatchInfo) {
  for (const p of match.players) {
    removeWaitingMatches(p.id)
    sendTo(p.id, { type: 'match-start', match })
  }
  const game = createGame(match.id, match.players, onGameUpdate)
  // A dealt hand can already win (all 5 specials), which ends the match on the spot.
  if (game.phase !== 'over') games.set(match.id, game)
  broadcastUsers()
}

function onGameUpdate(game: Game) {
  for (const { player } of game.players) {
    sendTo(player.id, { type: 'game-state', state: viewFor(game, player.id) })
  }
  // The final state stays on the clients' screens; the match itself is over.
  if (game.phase === 'over') {
    const match = matches.get(game.matchId)
    if (match) endMatch(match)
  }
}

function endMatch(match: MatchInfo) {
  const game = games.get(match.id)
  if (game) disposeGame(game)
  games.delete(match.id)
  matches.delete(match.id)
  for (const p of match.players) sendTo(p.id, { type: 'match-ended', matchId: match.id })
  broadcastUsers()
}

// Drops invite-link matches this player created that nobody has joined yet.
function removeWaitingMatches(playerId: string) {
  for (const match of matches.values()) {
    if (match.players.length < MATCH_SIZE && match.players[0]?.id === playerId) {
      matches.delete(match.id)
    }
  }
}

function isInMatch(playerId: string): boolean {
  for (const match of matches.values()) {
    if (match.players.length === MATCH_SIZE && match.players.some((p) => p.id === playerId)) {
      return true
    }
  }
  return false
}

function findPlayer(id: string): Player | undefined {
  for (const player of connections.values()) {
    if (player?.id === id) return player
  }
  return undefined
}

function isOnline(id: string): boolean {
  return findPlayer(id) !== undefined
}

function broadcastUsers() {
  const users = new Map<string, OnlineUser>()
  for (const player of connections.values()) {
    if (player && !users.has(player.id)) {
      users.set(player.id, { ...player, status: isInMatch(player.id) ? 'in-match' : 'available' })
    }
  }
  const msg: ServerMessage = { type: 'users', users: [...users.values()] }
  for (const [socket, player] of connections) {
    if (player) send(socket, msg)
  }
}

function sendTo(playerId: string, msg: ServerMessage) {
  for (const [socket, player] of connections) {
    if (player?.id === playerId) send(socket, msg)
  }
}

function send(socket: WebSocket, msg: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
}
