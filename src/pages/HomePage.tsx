import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { TEAMS, type Player, type Team } from '../../shared/player.ts'
import type { OnlineUser } from '../../shared/protocol.ts'
import { Avatar } from '../components/Avatar.tsx'
import { Logo } from '../components/Logo.tsx'
import { useServer } from '../net/ServerContext.ts'
import { usePlayer } from '../player/PlayerContext.ts'
import { TEAM_LABELS } from '../player/teams.ts'
import './HomePage.css'

export function HomePage() {
  const { player, logout } = usePlayer()
  const { status, users, invites, send, subscribe, dismissInvite } = useServer()
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
          setNotice(`${msg.by.name} não aceitou o convite.`)
        }
      }),
    [subscribe],
  )

  const onlineIds = new Set(users.map((u) => u.id))
  const visibleInvites = invites.filter((p) => onlineIds.has(p.id))

  // Flag the tab title while invites wait, so they get noticed from other tabs too.
  const inviteCount = visibleInvites.length
  useEffect(() => {
    if (inviteCount === 0) return
    const baseTitle = document.title
    document.title = `(${inviteCount}) ${inviteCount === 1 ? 'Convite' : 'Convites'} · ${baseTitle}`
    return () => {
      document.title = baseTitle
    }
  }, [inviteCount])

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
    navigator.share({ title: 'Cartas da Discórdia', text: 'Vem jogar comigo!', url: inviteLink }).catch(() => {
      // Share sheet closed: nothing to do.
    })
  }

  return (
    <div className="home-page">
      <header className="app-bar">
        <Logo />
        <nav className="app-bar-nav">
          <Link to="/regras" className="app-bar-link">
            Como jogar
          </Link>
          <span className="me-chip">
            <Avatar name={player.name} team={player.team} size="sm" />
            <span className="me-chip-text">
              <strong>{player.name}</strong>
              <span className={`me-chip-team team-text-${player.team}`}>{TEAM_LABELS[player.team]}</span>
            </span>
          </span>
          <button type="button" className="btn btn-ghost app-bar-btn" onClick={logout}>
            Trocar jogador
          </button>
        </nav>
      </header>

      <main className="home home-lobby">
        {!connected && (
          <p className="home-status" role="status">
            {status === 'connecting'
              ? 'Conectando ao servidor…'
              : 'Sem conexão com o servidor. Tentando reconectar…'}
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
                Jogadores online <span className="home-count">· {users.length}</span>
              </h2>
              <span>Você pode desafiar jogadores dos dois times.</span>
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
              <h2>Convidar um amigo</h2>
              {inviteLink ? (
                <>
                  <p>Mande este link. A partida começa assim que seu amigo entrar.</p>
                  <div className="home-link">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      aria-label="Link de convite"
                      onFocus={(e) => e.target.select()}
                    />
                    <button type="button" className="btn" onClick={copyLink}>
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  {canShare && (
                    <button type="button" className="btn btn-ghost home-wide-btn" onClick={shareLink}>
                      Compartilhar link
                    </button>
                  )}
                  <div className="home-waiting">
                    <span className="home-dot is-action" aria-hidden="true" />
                    <span>Aguardando seu amigo entrar…</span>
                    <button type="button" className="home-text-btn" onClick={cancelLink}>
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>Seu amigo não está na lista? Gere um link e mande para ele.</p>
                  <button
                    type="button"
                    className="btn home-wide-btn"
                    disabled={!connected}
                    onClick={() => send({ type: 'create-link' })}
                  >
                    Gerar link de convite
                  </button>
                </>
              )}
            </section>
            <section className="panel home-help">
              <h2>Primeira vez?</h2>
              <ol>
                <li>Convide alguém da lista ou mande um link.</li>
                <li>A cada turno, escolha 1 personagem da mão.</li>
                <li>Ataque os personagens do oponente até zerar a vida dele.</li>
              </ol>
              <Link to="/regras">Ver as regras completas</Link>
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
  const [first, ...rest] = invites
  return (
    <section className="invite-hero" aria-label="Convites recebidos" aria-live="polite">
      <div className="invite-main">
        <span className="invite-avatar">
          <Avatar name={first.name} team={first.team} size="lg" />
        </span>
        <div className="invite-text">
          <span className="invite-eyebrow">
            <BellIcon /> Novo convite
          </span>
          <h2>{first.name} te desafiou para uma partida!</h2>
          <p>
            {first.name} é do <strong>{TEAM_LABELS[first.team]}</strong>. Aceite para começar agora.
          </p>
        </div>
        <div className="invite-actions">
          <button type="button" className="invite-btn is-secondary" onClick={() => onRespond(first.id, false)}>
            Recusar
          </button>
          <button type="button" className="invite-btn is-primary" onClick={() => onRespond(first.id, true)}>
            Aceitar partida
          </button>
        </div>
      </div>
      {rest.map((p) => (
        <div key={p.id} className="invite-more">
          <Avatar name={p.name} team={p.team} size="sm" />
          <span className="invite-more-text">
            <strong>{p.name}</strong> ({TEAM_LABELS[p.team]}) também te convidou
          </span>
          <button type="button" className="invite-btn is-secondary is-small" onClick={() => onRespond(p.id, false)}>
            Recusar
          </button>
          <button type="button" className="invite-btn is-primary is-small" onClick={() => onRespond(p.id, true)}>
            Aceitar
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
  return (
    <div className={`team-list team-list-${team}`}>
      <div className="team-list-head">
        <strong>
          {TEAM_LABELS[team]}
          {mine && <span className="team-list-mine"> · seu time</span>}
        </strong>
        <span className="team-list-count">{users.length} online</span>
      </div>
      {users.length === 0 ? (
        <p className="team-list-empty">Ninguém do {TEAM_LABELS[team]} online agora.</p>
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
                    {STATUS_LABELS[state]}
                  </span>
                </span>
                {state === 'invited-me' ? (
                  <button type="button" className="btn btn-action" onClick={() => onAccept(user.id)}>
                    Aceitar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn"
                    disabled={!connected || state !== 'available'}
                    onClick={() => onInvite(user.id)}
                  >
                    {state === 'busy' ? 'Ocupado' : state === 'sent' ? 'Enviado' : 'Convidar'}
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

const STATUS_LABELS = {
  'invited-me': 'Te convidou',
  busy: 'Em partida',
  sent: 'Convite enviado',
  available: 'Disponível',
} as const

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
