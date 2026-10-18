export const TEAMS = ['red', 'blue'] as const

export type Team = (typeof TEAMS)[number]

export type Player = {
  id: string
  name: string
  team: Team
}

export const NAME_MIN_LENGTH = 2
export const NAME_MAX_LENGTH = 20
// Letters (accents included) and digits only: no spaces or symbols.
export const NAME_PATTERN = /^[\p{L}\p{N}]+$/u

export function isPlayer(data: unknown): data is Player {
  if (typeof data !== 'object' || data === null) return false
  const { id, name, team } = data as Record<string, unknown>
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= 64 &&
    typeof name === 'string' &&
    name.length >= NAME_MIN_LENGTH &&
    name.length <= NAME_MAX_LENGTH &&
    NAME_PATTERN.test(name) &&
    TEAMS.includes(team as Team)
  )
}
