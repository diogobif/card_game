import type { Team } from '../../shared/player.ts'
import { useI18n } from '../i18n/I18nContext.ts'

export function TeamBadge({ team }: { team: Team }) {
  const { t } = useI18n()
  return <span className={`team-badge team-badge-${team}`}>{t.teams[team]}</span>
}
