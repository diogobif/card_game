import type { Team } from '../../shared/player.ts'
import { TEAM_LABELS } from '../player/teams.ts'

export function TeamBadge({ team }: { team: Team }) {
  return <span className={`team-badge team-badge-${team}`}>{TEAM_LABELS[team]}</span>
}
