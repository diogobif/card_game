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
import { useI18n } from '../i18n/I18nContext.ts'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher.tsx'
import './LoginPage.css'

export function LoginPage() {
  const { player, login } = usePlayer()
  const { t } = useI18n()
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
      ? t.login.nameTooShort
      : !NAME_PATTERN.test(trimmed)
        ? t.login.nameInvalid
        : null
  const teamError = team ? null : t.login.teamRequired
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
      <LanguageSwitcher className="login-lang" />
      <div className="login-layout">
        <section className="login-intro">
          <Logo size="lg" as="h1" />
          <p className="login-tagline">
            <strong>{t.login.taglineStrong}</strong> {t.login.tagline}
          </p>
        </section>

        <form className="login-card" onSubmit={handleSubmit} noValidate>
          {fromInvite && (
            <div className="login-invite" role="status">
              <strong>{t.login.invitedTitle}</strong>
              <span>{t.login.invitedText}</span>
            </div>
          )}
          <h2>{t.login.heading}</h2>

          <label className="login-field">
            <span>{t.login.nameLabel}</span>
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
              {showNameError ? nameError : t.login.nameHint}
            </span>
          </label>

          <fieldset className="login-teams">
            <legend>{t.login.teamLegend}</legend>
            <div className="login-team-grid">
              {TEAMS.map((option) => (
                <label key={option} className={`team-option team-option-${option}`}>
                  <input
                    type="radio"
                    name="team"
                    value={option}
                    checked={team === option}
                    onChange={() => setTeam(option)}
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
                    <strong>{t.teams[option]}</strong>
                    <span>{t.login.characters(CHARACTERS.filter((c) => c.team === option).length)}</span>
                  </span>
                </label>
              ))}
            </div>
            {submitted && teamError && <span className="login-error">{teamError}</span>}
          </fieldset>

          <button type="submit" className={`login-submit${team ? ` login-submit-${team}` : ''}`}>
            {fromInvite ? t.login.submitInvite : team ? t.login.submitTeam(t.teams[team]) : t.login.submit}
          </button>
          {/* New tab, so the form and any pending invite redirect survive. */}
          <a href="/regras" target="_blank" rel="noopener" className="login-rules">
            {t.login.rulesLink}
          </a>
        </form>

        <ol className="login-steps">
          {t.login.steps.map(([title, text]) => (
            <li key={title}>
              <strong>{title}</strong> {text}
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}
