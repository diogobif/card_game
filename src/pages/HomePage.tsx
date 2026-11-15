import { useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { TEAMS, type Player, type Team } from '../../shared/player.ts'
import type { OnlineUser } from '../../shared/protocol.ts'
import { Avatar } from '../components/Avatar.tsx'
import { Logo } from '../components/Logo.tsx'
import { useServer } from '../net/ServerContext.ts'
import { usePlayer } from '../player/PlayerContext.ts'
import { useI18n } from '../i18n/I18nContext.ts'
import { LanguageSwitcher } from '../i18n/LanguageSwitcher.tsx'
import './HomePage.css'

export function HomePage() {
  const { player, logout } = usePlayer()
  const { status, users, invites, send, subscribe, dismissInvite } = useServer()
  const { t } = useI18n()
  // Read through a ref so the subscription doesn't restart when the language changes.
  const declinedRef = useRef(t.home.declined)
  useEffect(() => {
    declinedRef.current = t.home.declined
  })
  const [linkMatchId, setLinkMatchId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sentInvites, setSentInvites] = useState<ReadonlySet<string>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type === 'link-created') setLinkMatchId(msg.matchId)
        if (msg.type === 'invite-declined') {
          setSentInvites((prev) => new Set([...prev].filter((id) => id !== msg.by.id)))
          setNotice(declinedRef.current(msg.by.name))
        }
      }),
    [subscribe],
  )

  const onlineIds = new Set(users.map((u) => u.id))
  const visibleInvites = invites.filter((p) => onlineIds.has(p.id))

  // Flag the tab title while invites wait, so they get noticed from other tabs too.
  const inviteCount = visibleInvites.length
  const invitesFlag = inviteCount > 0 ? t.home.tabInvites(inviteCount) : null
  useEffect(() => {
    if (!invitesFlag) return
    const baseTitle = document.title
    document.title = `${invitesFlag} · ${baseTitle}`
    return () => {
      document.title = baseTitle
    }
  }, [invitesFlag])

  if (!player) return <Navigate to="/" replace />

  const connected = status === 'open'
  const invitedBy = new Set(visibleInvites.map((p) => p.id))
  const inviteLink = linkMatchId ? `${location.origin}/match/${linkMatchId}` : null
  const canShare = typeof navigator.share === 'function'

  function inviteUser(id: string) {
    send({ type: 'invite', to: id })
    setSentInvites((prev) => new Set(prev).add(id))
    setNotice(null)
  }

  function respondInvite(fromId: string, accept: boolean) {
    send({ type: 'invite-response', from: fromId, accept })
    dismissInvite(fromId)
  }

  function cancelLink() {
    if (linkMatchId) send({ type: 'leave-match', matchId: linkMatchId })
    setLinkMatchId(null)
  }

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        // Clipboard blocked: the link is still selectable in the input.
      })
  }

  function shareLink() {
    if (!inviteLink) return
    navigator.share({ title: 'Cartas da Discórdia', text: t.home.shareText, url: inviteLink }).catch(() => {
      // Share sheet closed: nothing to do.
    })
  }

  return (
    <div className="home-page">
      <header className="app-bar">
        <Logo />
        <nav className="app-bar-nav">
          <Link to="/regras" className="app-bar-link">
            {t.common.howToPlay}
          </Link>
          <LanguageSwitcher />
          <span className="me-chip">
            <Avatar name={player.name} team={player.team} size="sm" />
            <span className="me-chip-text">
              <strong>{player.name}</strong>
              <span className={`me-chip-team team-text-${player.team}`}>{t.teams[player.team]}</span>
            </span>
          </span>
          <button type="button" className="btn btn-ghost app-bar-btn" onClick={logout}>
            {t.home.switchPlayer}
          </button>
        </nav>
      </header>

      <main className="home home-lobby">
        {!connected && (
          <p className="home-status" role="status">
            {status === 'connecting'
              ? t.common.connecting
              : t.home.disconnected}
          </p>
        )}
        {notice && (
          <p className="home-notice" role="status">
            {notice}
          </p>
        )}

        {visibleInvites.length > 0 && (
          <InviteHero invites={visibleInvites} onRespond={respondInvite} />
        )}

        <div className="home-grid">
          <section className="home-players" aria-labelledby="online-title">
            <div className="home-section-head">
              <h2 id="online-title">
                {t.home.onlinePlayers} <span className="home-count">· {users.length}</span>
              </h2>
              <span>{t.home.challengeAny}</span>
            </div>
            <div className="home-teams">
              {TEAMS.map((team) => (
                <TeamList
                  key={team}
                  team={team}
                  mine={team === player.team}
                  users={users.filter((u) => u.team === team)}
                  invitedBy={invitedBy}
                  sentInvites={sentInvites}
                  connected={connected}
                  onInvite={inviteUser}
                  onAccept={(id) => respondInvite(id, true)}
                />
              ))}
            </div>
          </section>

          <aside className="home-aside">
            <section className="panel home-link-card">
              <h2>{t.home.inviteFriend}</h2>
              {inviteLink ? (
                <>
                  <p>{t.home.linkReady}</p>
                  <div className="home-link">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      aria-label={t.home.inviteLinkLabel}
                      onFocus={(e) => e.target.select()}
                    />
                    <button type="button" className="btn" onClick={copyLink}>
                      {copied ? t.home.copied : t.home.copy}
                    </button>
                  </div>
                  {canShare && (
                    <button type="button" className="btn btn-ghost home-wide-btn" onClick={shareLink}>
                      {t.home.shareLink}
                    </button>
                  )}
                  <div className="home-waiting">
                    <span className="home-dot is-action" aria-hidden="true" />
                    <span>{t.home.waitingFriend}</span>
                    <button type="button" className="home-text-btn" onClick={cancelLink}>
                      {t.home.cancel}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>{t.home.noLinkYet}</p>
                  <button
                    type="button"
                    className="btn home-wide-btn"
                    disabled={!connected}
                    onClick={() => send({ type: 'create-link' })}
                  >
                    {t.home.createLink}
                  </button>
                </>
              )}
            </section>
            <section className="panel home-help">
              <h2>{t.home.firstTime}</h2>
              <ol>
                {t.home.helpSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link to="/regras">{t.home.fullRules}</Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}

type InviteHeroProps = {
  invites: Player[]
  onRespond: (fromId: string, accept: boolean) => void
}

/** The first invite gets the full banner; any others stack below it in smaller rows. */
function InviteHero({ invites, onRespond }: InviteHeroProps) {
  const { t } = useI18n()
  const [first, ...rest] = invites
  const [teamBefore, teamAfter] = t.home.inviterTeam(first.name)
  return (
    <section className="invite-hero" aria-label={t.home.invitesReceived} aria-live="polite">
      <div className="invite-main">
        <span className="invite-avatar">
          <Avatar name={first.name} team={first.team} size="lg" />
        </span>
        <div className="invite-text">
          <span className="invite-eyebrow">
            <BellIcon /> {t.home.newInvite}
          </span>
          <h2>{t.home.challenged(first.name)}</h2>
          <p>
            {teamBefore}
            <strong>{t.teams[first.team]}</strong>
            {teamAfter}
          </p>
        </div>
        <div className="invite-actions">
          <button type="button" className="invite-btn is-secondary" onClick={() => onRespond(first.id, false)}>
            {t.home.decline}
          </button>
          <button type="button" className="invite-btn is-primary" onClick={() => onRespond(first.id, true)}>
            {t.home.acceptMatch}
          </button>
        </div>
      </div>
      {rest.map((p) => (
        <div key={p.id} className="invite-more">
          <Avatar name={p.name} team={p.team} size="sm" />
          <span className="invite-more-text">
            <strong>{p.name}</strong>
            {t.home.alsoInvited(t.teams[p.team])}
          </span>
          <button type="button" className="invite-btn is-secondary is-small" onClick={() => onRespond(p.id, false)}>
            {t.home.decline}
          </button>
          <button type="button" className="invite-btn is-primary is-small" onClick={() => onRespond(p.id, true)}>
            {t.home.accept}
          </button>
        </div>
      ))}
    </section>
  )
}

type TeamListProps = {
  team: Team
  mine: boolean
  users: OnlineUser[]
  invitedBy: ReadonlySet<string>
  sentInvites: ReadonlySet<string>
  connected: boolean
  onInvite: (id: string) => void
  onAccept: (id: string) => void
}

function TeamList({ team, mine, users, invitedBy, sentInvites, connected, onInvite, onAccept }: TeamListProps) {
  const { t } = useI18n()
  return (
    <div className={`team-list team-list-${team}`}>
      <div className="team-list-head">
        <strong>
          {t.teams[team]}
          {mine && <span className="team-list-mine">{t.home.yourTeam}</span>}
        </strong>
        <span className="team-list-count">{t.home.online(users.length)}</span>
      </div>
      {users.length === 0 ? (
        <p className="team-list-empty">{t.home.noneOnline(t.teams[team])}</p>
      ) : (
        <ul>
          {users.map((user) => {
            const invitedMe = invitedBy.has(user.id)
            const inMatch = user.status === 'in-match'
            const sent = sentInvites.has(user.id)
            const state = invitedMe ? 'invited-me' : inMatch ? 'busy' : sent ? 'sent' : 'available'
            return (
              <li key={user.id} className="team-row">
                <Avatar name={user.name} team={user.team} />
                <span className="team-row-text">
                  <strong>{user.name}</strong>
                  <span className={`team-row-status is-${state}`}>
                    <span className="home-dot" aria-hidden="true" />
                    {t.home.status[state]}
                  </span>
                </span>
                {state === 'invited-me' ? (
                  <button type="button" className="btn btn-action" onClick={() => onAccept(user.id)}>
                    {t.home.accept}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    disabled={!connected || state !== 'available'}
                    onClick={() => onInvite(user.id)}
                  >
                    {state === 'busy' ? t.home.busy : state === 'sent' ? t.home.sent : t.home.invite}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function BellIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
