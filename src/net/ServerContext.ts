import { createContext, useContext } from 'react'
import type { GameView } from '../../shared/game.ts'
import type { Player } from '../../shared/player.ts'
import type {
  ClientMessage,
  MatchInfo,
  OnlineUser,
  ServerMessage,
} from '../../shared/protocol.ts'

export type ConnectionStatus = 'connecting' | 'open' | 'closed'

export type ServerListener = (msg: ServerMessage) => void

export type ServerContextValue = {
  status: ConnectionStatus
  /** Other players online (never includes the current player). */
  users: OnlineUser[]
  /** Pending invites received from other players. */
  invites: Player[]
  currentMatch: MatchInfo | null
  /** Latest game state; kept after the match ends so the result stays visible. */
  game: GameView | null
  /** Dropped silently when not connected. */
  send: (msg: ClientMessage) => void
  /** Listen to every server message; returns an unsubscribe function. */
  subscribe: (listener: ServerListener) => () => void
  dismissInvite: (fromId: string) => void
}

export const ServerContext = createContext<ServerContextValue | null>(null)

export function useServer(): ServerContextValue {
  const value = useContext(ServerContext)
  if (!value) throw new Error('useServer must be used inside <ServerProvider>')
  return value
}
