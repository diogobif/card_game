import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it } from 'vitest'
import { loadPlayer, savePlayer } from '../player/storage.ts'
import { PlayerProvider } from '../player/PlayerProvider.tsx'
import { LoginPage } from './LoginPage.tsx'

function renderLogin(from?: string) {
  render(
    <PlayerProvider>
      <MemoryRouter initialEntries={[{ pathname: '/', state: from ? { from } : null }]}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<p>Página inicial</p>} />
          <Route path="/match/:matchId" element={<p>Página da partida</p>} />
        </Routes>
      </MemoryRouter>
    </PlayerProvider>,
  )
}

describe('LoginPage', () => {
  it('shows both teams with their character count', () => {
    renderLogin()
    expect(screen.getByRole('radio', { name: /Time Vermelho/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Time Azul/ })).toBeInTheDocument()
    expect(screen.getAllByText('20 personagens')).toHaveLength(2)
  })

  it('shows errors only after submitting an empty form', async () => {
    renderLogin()
    expect(screen.queryByText('Escolha um time.')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('O nome precisa ter pelo menos 2 caracteres.')).toBeInTheDocument()
    expect(screen.getByText('Escolha um time.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Seu nome/ })).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByText('Página inicial')).not.toBeInTheDocument()
  })

  it('rejects names with spaces or symbols', async () => {
    renderLogin()
    await userEvent.type(screen.getByRole('textbox', { name: /Seu nome/ }), 'Ana Maria')
    await userEvent.click(screen.getByRole('radio', { name: /Time Azul/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no Time Azul' }))
    expect(screen.getByText('Use apenas letras e números, sem espaços ou símbolos.')).toBeInTheDocument()
    expect(loadPlayer()).toBeNull()
  })

  it('logs in, saves the player in this tab and goes to the home page', async () => {
    renderLogin()
    await userEvent.type(screen.getByRole('textbox', { name: /Seu nome/ }), '  João  ')
    await userEvent.click(screen.getByRole('radio', { name: /Time Vermelho/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar no Time Vermelho' }))

    expect(await screen.findByText('Página inicial')).toBeInTheDocument()
    expect(loadPlayer()).toMatchObject({ name: 'João', team: 'red' })
  })

  it('returns to the invite link after logging in', async () => {
    renderLogin('/match/abc123')
    expect(screen.getByText('Você foi convidado para uma partida!')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: /Seu nome/ }), 'Bia')
    await userEvent.click(screen.getByRole('radio', { name: /Time Azul/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Entrar na partida' }))
    expect(await screen.findByText('Página da partida')).toBeInTheDocument()
  })

  it('skips the form for a player who is already logged in', () => {
    savePlayer({ id: 'p1', name: 'Ana', team: 'blue' })
    renderLogin()
    expect(screen.getByText('Página inicial')).toBeInTheDocument()
  })
})
