import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { TeamBadge } from '../components/TeamBadge.tsx'
import { useServer } from '../net/ServerContext.ts'
import { usePlayer } from '../player/PlayerContext.ts'
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

  if (!player) return <Navigate to="/" replace />

  const connected = status === 'open'
  const onlineIds = new Set(users.map((u) => u.id))
  const visibleInvites = invites.filter((p) => onlineIds.has(p.id))
  const inviteLink = linkMatchId ? `${location.origin}/match/${linkMatchId}` : null

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

  return (
    <main className="home">
      <header className="home-header">
        <div>
          <h1>Olá, {player.name}</h1>
          <TeamBadge team={player.team} />
        </div>
        <div className="home-actions">
          <Link to="/regras" className="btn btn-ghost">
            Como jogar
          </Link>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Trocar jogador
          </button>
        </div>
      </header>

      {!connected && (
        <p className="home-status" role="status">
          {status === 'connecting' ? 'Conectando ao servidor…' : 'Sem conexão com o servidor. Tentando reconectar…'}
        </p>
      )}
      {notice && (
        <p className="home-notice" role="status">
          {notice}
        </p>
      )}

      {visibleInvites.length > 0 && (
        <section className="panel">
          <h2>Convites recebidos</h2>
          <ul className="home-list">
            {visibleInvites.map((from) => (
              <li key={from.id} className="home-row">
                <span className="home-user">
                  <strong>{from.name}</strong> te convidou
                  <TeamBadge team={from.team} />
                </span>
                <span className="home-actions">
                  <button type="button" className="btn" onClick={() => respondInvite(from.id, true)}>
                    Aceitar
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => respondInvite(from.id, false)}>
                    Recusar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel">
        <h2>Convidar um amigo</h2>
        {inviteLink ? (
          <>
            <p>Envie este link. A partida começa quando seu amigo entrar.</p>
            <div className="home-link">
              <input type="text" readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn" onClick={copyLink}>
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="home-waiting">Aguardando seu amigo entrar…</p>
            <button type="button" className="btn btn-ghost" onClick={cancelLink}>
              Cancelar convite
            </button>
          </>
        ) : (
          <>
            <p>Gere um link e envie para quem você quer enfrentar.</p>
            <button
              type="button"
              className="btn"
              disabled={!connected}
              onClick={() => send({ type: 'create-link' })}
            >
              Gerar link de convite
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h2>Jogadores online ({users.length})</h2>
        {users.length === 0 ? (
          <p>Nenhum outro jogador online no momento.</p>
        ) : (
          <ul className="home-list">
            {users.map((user) => {
              const inMatch = user.status === 'in-match'
              const invited = sentInvites.has(user.id)
              return (
                <li key={user.id} className="home-row">
                  <span className="home-user">
                    <strong>{user.name}</strong>
                    <TeamBadge team={user.team} />
                    {inMatch && <span className="home-tag">Em partida</span>}
                  </span>
                  <button
                    type="button"
                    className="btn"
                    disabled={!connected || inMatch || invited}
                    onClick={() => inviteUser(user.id)}
                  >
                    {invited ? 'Convite enviado' : 'Convidar'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}
