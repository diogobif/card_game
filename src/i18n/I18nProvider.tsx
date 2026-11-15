import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HTML_LANG, I18nContext, MESSAGES, type Language } from './I18nContext.ts'
import { loadLanguage, saveLanguage } from './storage.ts'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(loadLanguage)

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang]
  }, [lang])

  const value = useMemo(
    () => ({
      lang,
      t: MESSAGES[lang],
      setLang(next: Language) {
        saveLanguage(next)
        setLangState(next)
      },
    }),
    [lang],
  )

  return <I18nContext value={value}>{children}</I18nContext>
}
