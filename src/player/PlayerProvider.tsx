import { useMemo, useState, type ReactNode } from 'react'
import { PlayerContext } from './PlayerContext.ts'
import { clearPlayer, loadPlayer, savePlayer } from './storage.ts'
import type { Player } from '../../shared/player.ts'

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(loadPlayer)

  const value = useMemo(
    () => ({
      player,
      login(next: Player) {
        savePlayer(next)
        setPlayer(next)
      },
      logout() {
        clearPlayer()
        setPlayer(null)
      },
    }),
    [player],
  )

  return <PlayerContext value={value}>{children}</PlayerContext>
}
