import { CATEGORIES } from '../../shared/cards.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import { RulesEn } from './RulesEn.tsx'
import { RulesPt } from './RulesPt.tsx'
import './Rules.css'

/** The game rules, shared by the rules page and the in-match help panel. */
export function Rules() {
  const { lang, t } = useI18n()
  const categories = CATEGORIES.map((c) => t.categories[c]).join(', ')
  return lang === 'en' ? <RulesEn categories={categories} /> : <RulesPt categories={categories} />
}
