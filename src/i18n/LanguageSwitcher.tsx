import { LANGUAGES, useI18n } from './I18nContext.ts'
import './LanguageSwitcher.css'

const SHORT: Record<(typeof LANGUAGES)[number], { label: string; name: string }> = {
  pt: { label: 'PT', name: 'Português' },
  en: { label: 'EN', name: 'English' },
}

/** PT / EN toggle. Each option is named in its own language so it can be found either way. */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={`lang-switch${className ? ` ${className}` : ''}`} role="group" aria-label={t.language.label}>
      {LANGUAGES.map((l) => (
        <button
          key={l}
          type="button"
          className={l === lang ? 'is-current' : undefined}
          aria-pressed={l === lang}
          aria-label={SHORT[l].name}
          title={SHORT[l].name}
          lang={l === 'pt' ? 'pt-BR' : l}
          onClick={() => setLang(l)}
        >
          {SHORT[l].label}
        </button>
      ))}
    </div>
  )
}
