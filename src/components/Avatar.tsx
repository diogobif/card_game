import type { Team } from '../../shared/player.ts'
import { initialsOf } from '../player/initials.ts'

type Props = {
  name: string
  team: Team
  size?: 'sm' | 'md' | 'lg'
}

/** Team-colored circle with the player's initials. */
export function Avatar({ name, team, size = 'md' }: Props) {
  return (
    <span className={`avatar avatar-${size} avatar-${team}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}
