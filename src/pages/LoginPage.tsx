import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_PATTERN,
  TEAMS,
  type Team,
} from '../../shared/player.ts'
import { usePlayer } from '../player/PlayerContext.ts'
import { createPlayerId } from '../player/storage.ts'
import { TEAM_LABELS } from '../player/teams.ts'
import './LoginPage.css'

export function LoginPage() {
  const { player, login } = usePlayer()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [team, setTeam] = useState<Team | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Set by pages that require a player (e.g. an invite link opened before logging in).
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/home'

  if (player) return <Navigate to={redirectTo} replace />

  const trimmed = name.trim()
  const nameError =
    trimmed.length < NAME_MIN_LENGTH
      ? `O nome precisa ter pelo menos ${NAME_MIN_LENGTH} caracteres.`
      : !NAME_PATTERN.test(trimmed)
        ? 'Use apenas letras e números, sem espaços ou símbolos.'
        : null
  const teamError = team ? null : 'Escolha um time.'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (nameError || !team) return
    login({ id: createPlayerId(), name: trimmed, team })
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="login">
      <form className="login-card" onSubmit={handleSubmit} noValidate>
        <h1>Card Game</h1>
        <p className="login-subtitle">Escolha seu nome e seu time para jogar.</p>

        <label className="login-field">
          <span>Nome</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX_LENGTH}
            autoComplete="nickname"
            autoFocus
            aria-invalid={submitted && !!nameError}
          />
        </label>
        {submitted && nameError && <p className="login-error">{nameError}</p>}

        <fieldset className="login-teams">
          <legend>Time</legend>
          {TEAMS.map((t) => (
            <label key={t} className={`team-option team-${t}`}>
              <input
                type="radio"
                name="team"
                value={t}
                checked={team === t}
                onChange={() => setTeam(t)}
              />
              <span>{TEAM_LABELS[t]}</span>
            </label>
          ))}
        </fieldset>
        {submitted && teamError && <p className="login-error">{teamError}</p>}

        <button type="submit" className="login-submit">
          Entrar
        </button>
        {/* New tab, so the form and any pending invite redirect survive. */}
        <a href="/regras" target="_blank" rel="noopener" className="login-rules">
          Como jogar?
        </a>
      </form>
    </main>
  )
}
