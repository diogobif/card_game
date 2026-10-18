import { createContext, useContext } from 'react'
import type { Player } from '../../shared/player.ts'

export type PlayerContextValue = {
  player: Player | null
  login: (player: Player) => void
  logout: () => void
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer(): PlayerContextValue {
  const value = useContext(PlayerContext)
  if (!value) throw new Error('usePlayer must be used inside <PlayerProvider>')
  return value
}
