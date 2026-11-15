import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import type { LogEntry } from '../../shared/game.ts'
import { LoginPage } from '../pages/LoginPage.tsx'
import { PlayerProvider } from '../player/PlayerProvider.tsx'
import { en } from './en.ts'
import { I18nProvider } from './I18nProvider.tsx'
import { pt } from './pt.ts'
import { loadLanguage } from './storage.ts'

function renderLogin() {
  render(
    <I18nProvider>
      <PlayerProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </PlayerProvider>
    </I18nProvider>,
  )
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.lang = ''
})

describe('language', () => {
  it('defaults to Portuguese', () => {
    renderLogin()
    expect(loadLanguage()).toBe('pt')
    expect(screen.getByRole('heading', { name: 'Entrar no jogo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Português' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('switches to English and remembers the choice', async () => {
    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('heading', { name: 'Join the game' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Red Team/ })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Your name/ })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(loadLanguage()).toBe('en')

    await userEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(screen.getByText('Pick a team.')).toBeInTheDocument()
  })

  it('starts in the saved language', () => {
    localStorage.setItem('card-game:lang', 'en')
    renderLogin()
    expect(screen.getByRole('heading', { name: 'Join the game' })).toBeInTheDocument()
  })

  it('ignores an unknown saved language', () => {
    localStorage.setItem('card-game:lang', 'fr')
    expect(loadLanguage()).toBe('pt')
  })
})

describe('match history', () => {
  const entries: LogEntry[] = [
    { kind: 'arena', arena: 'Praça' },
    { kind: 'forfeit', player: 'Ana' },
    { kind: 'disconnect', player: 'Ana' },
    { kind: 'direct-attack', attacker: 'Tio do Zap', player: 'Bia', damage: 3 },
    { kind: 'attack', attacker: 'Tio do Zap', power: 3, target: 'Pastor', guard: 7 },
    { kind: 'excess-damage', player: 'Bia', damage: 2 },
    { kind: 'left-arena', card: 'Pastor' },
    { kind: 'auto-pick', player: 'Bia' },
    { kind: 'arenas-full' },
    { kind: 'played', player: 'Ana', card: 'Pastor' },
    { kind: 'support', player: 'Ana', support: 'Live' },
    { kind: 'no-attackers', player: 'Ana' },
    { kind: 'attack-timeout', player: 'Ana' },
  ]

  it('renders every entry in both languages', () => {
    for (const entry of entries) {
      expect(pt.log(entry)).not.toBe('')
      // "Arena: <name>." reads the same in both languages.
      if (entry.kind !== 'arena') expect(en.log(entry)).not.toBe(pt.log(entry))
    }
  })

  it('keeps the Portuguese wording', () => {
    expect(pt.log({ kind: 'auto-pick', player: 'Bia' })).toBe('Bia não escolheu a tempo; carta aleatória.')
    expect(en.log({ kind: 'auto-pick', player: 'Bia' })).toBe("Bia didn't choose in time; random card.")
  })
})
