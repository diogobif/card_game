import { DEFAULT_LANGUAGE, isLanguage, type Language } from './I18nContext.ts'

// localStorage, not sessionStorage: the language is a device preference shared by every tab.
const KEY = 'card-game:lang'

export function loadLanguage(): Language {
  try {
    const value = localStorage.getItem(KEY)
    return isLanguage(value) ? value : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

export function saveLanguage(lang: Language) {
  try {
    localStorage.setItem(KEY, lang)
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
}
