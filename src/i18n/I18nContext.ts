import { createContext, useContext } from 'react'
import { en } from './en.ts'
import { pt, type Messages } from './pt.ts'

export const LANGUAGES = ['pt', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

/** Portuguese unless the player picks another language. */
export const DEFAULT_LANGUAGE: Language = 'pt'

export const MESSAGES: Record<Language, Messages> = { pt, en }

/** Value of the `lang` attribute on <html> for each language. */
export const HTML_LANG: Record<Language, string> = { pt: 'pt-BR', en: 'en' }

export type I18nContextValue = {
  lang: Language
  setLang: (lang: Language) => void
  /** The messages for the current language. */
  t: Messages
}

// Outside a provider (e.g. in a component test) the app reads in the default language.
export const I18nContext = createContext<I18nContextValue>({
  lang: DEFAULT_LANGUAGE,
  setLang: () => {},
  t: MESSAGES[DEFAULT_LANGUAGE],
})

export function useI18n(): I18nContextValue {
  return useContext(I18nContext)
}

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}
