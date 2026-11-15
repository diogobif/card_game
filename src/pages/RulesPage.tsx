import { Link } from 'react-router'
import { useI18n } from '../i18n/I18nContext.ts'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher.tsx'
import { usePlayer } from '../player/PlayerContext.ts'
import { Rules } from '../rules/Rules.tsx'

// Public: no login needed, so new players can read the rules first.
export function RulesPage() {
  const { player } = usePlayer()
  const { t } = useI18n()
  return (
    <main className="home">
      <section className="panel">
        <h1>{t.common.howToPlay}</h1>
        <Rules />
      </section>
      <Link to={player ? '/home' : '/'}>{t.common.back}</Link>
      <LanguageSwitcher />
    </main>
  )
}
