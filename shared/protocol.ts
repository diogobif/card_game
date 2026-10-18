import type { GameView } from './game.ts'
import type { Player } from './player.ts'

export const WS_PATH = '/ws'

export type UserStatus = 'available' | 'in-match'

export type OnlineUser = Player & { status: UserStatus }

export type MatchInfo = {
  id: string
  players: Player[]
}

export type MatchErrorReason = 'not-found' | 'full'

export type ClientMessage =
  | { type: 'hello'; player: Player }
  | { type: 'invite'; to: string }
  | { type: 'invite-response'; from: string; accept: boolean }
  | { type: 'create-link' }
  | { type: 'join-match'; matchId: string }
  | { type: 'leave-match'; matchId: string }
  // The support card, if used, is committed together with the character.
  | { type: 'play-card'; matchId: string; cardId: string; useSupport: boolean }
  // targetCardId is null only when the opponent has no characters in the arena.
  | { type: 'attack'; matchId: string; attackerCardId: string; targetCardId: string | null }

export type ServerMessage =
  | { type: 'users'; users: OnlineUser[] }
  | { type: 'invite-received'; from: Player }
  | { type: 'invite-declined'; by: Player }
  | { type: 'link-created'; matchId: string }
  | { type: 'match-start'; match: MatchInfo }
  | { type: 'match-ended'; matchId: string }
  | { type: 'match-error'; matchId: string; reason: MatchErrorReason }
  | { type: 'game-state'; state: GameView }
