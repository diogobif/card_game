import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { CHARACTERS } from '../../shared/cards.ts'
import {
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_PATTERN,
  TEAMS,
  type Team,
} from '../../shared/player.ts'
import { Logo } from '../components/Logo.tsx'
import { usePlayer } from '../player/PlayerContext.ts'
import { createPlayerId } from '../player/storage.ts'
import { TEAM_LABELS } from '../player/teams.ts'
import './LoginPage.css'

const NAME_HINT = `De ${NAME_MIN_LENGTH} a ${NAME_MAX_LENGTH} letras ou números, sem espaços.`

export function LoginPage() {
  const { player, login } = usePlayer()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [team, setTeam] = useState<Team | null>(null)
  const [submitted, setSubmitted] = useState(false)

  // Set by pages that require a player (e.g. an invite link opened before logging in).
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/home'
  const fromInvite = redirectTo.startsWith('/match/')

  if (player) return <Navigate to={redirectTo} replace />

  const trimmed = name.trim()
  const nameError =
    trimmed.length < NAME_MIN_LENGTH
      ? `O nome precisa ter pelo menos ${NAME_MIN_LENGTH} caracteres.`
      : !NAME_PATTERN.test(trimmed)
        ? 'Use apenas letras e números, sem espaços ou símbolos.'
        : null
  const teamError = team ? null : 'Escolha um time.'
  const showNameError = submitted && !!nameError

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    if (nameError || !team) return
    login({ id: createPlayerId(), name: trimmed, team })
    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="login">
      <div className="login-layout">
        <section className="login-intro">
          <Logo size="lg" as="h1" />
          <p className="login-tagline">
            <strong>Vermelho contra azul, carta contra carta.</strong> Um duelo por turnos para dois
            jogadores. Sem cadastro: escolha um nome e um lado e comece a briga.
          </p>
        </section>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          {fromInvite && (
            <div className="login-invite" role="status">
              <strong>Você foi convidado para uma partida!</strong>
              <span>Escolha um nome e um time. A partida começa assim que você entrar.</span>
            </div>
          )}
          <h2>Entrar no jogo</h2>

          <label className="login-field">
            <span>Seu nome</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={NAME_MAX_LENGTH}
              autoComplete="nickname"
              autoFocus
              aria-invalid={showNameError}
              aria-describedby="name-help"
            />
            <span id="name-help" className={showNameError ? 'login-error' : 'login-help'}>
              {showNameError ? nameError : NAME_HINT}
            </span>
          </label>

          <fieldset className="login-teams">
            <legend>Seu time</legend>
            <div className="login-team-grid">
              {TEAMS.map((t) => (
                <label key={t} className={`team-option team-option-${t}`}>
                  <input
                    type="radio"
                    name="team"
                    value={t}
                    checked={team === t}
                    onChange={() => setTeam(t)}
                  />
                  <span className="team-option-art" aria-hidden="true">
                    <span />
                  </span>
                  <span className="team-option-check" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span className="team-option-label">
                    <strong>{TEAM_LABELS[t]}</strong>
                    <span>{CHARACTERS.filter((c) => c.team === t).length} personagens</span>
                  </span>
                </label>
              ))}
            </div>
            {submitted && teamError && <span className="login-error">{teamError}</span>}
          </fieldset>

          <button type="submit" className={`login-submit${team ? ` login-submit-${team}` : ''}`}>
            {fromInvite ? 'Entrar na partida' : team ? `Entrar no ${TEAM_LABELS[team]}` : 'Entrar'}
          </button>
          {/* New tab, so the form and any pending invite redirect survive. */}
          <a href="/regras" target="_blank" rel="noopener" className="login-rules">
            Como jogar?
          </a>
        </form>

        <ol className="login-steps">
          <li>
            <strong>Escolha seu time.</strong> Você joga com as cartas do Time Vermelho ou do Time Azul.
          </li>
          <li>
            <strong>Desafie alguém.</strong> Convide um jogador online ou mande um link para um amigo.
          </li>
          <li>
            <strong>Jogue em turnos de 1 minuto.</strong> Coloque personagens na arena e ataque até zerar
            a vida do oponente.
          </li>
        </ol>
      </div>
    </main>
  )
}
