import { isPlayer, type Player } from '../../shared/player.ts'

// sessionStorage keeps the player per browser tab, so two tabs can play
// against each other while testing. There is no database by design.
const STORAGE_KEY = 'card_game.player'

export function loadPlayer(): Player | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    return isPlayer(data) ? data : null
  } catch {
    return null
  }
}

export function savePlayer(player: Player): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(player))
  } catch {
    // Storage unavailable (private mode, blocked): the player lives in memory only.
  }
}

export function clearPlayer(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function createPlayerId(): string {
  // randomUUID only exists in secure contexts (https or localhost).
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}
