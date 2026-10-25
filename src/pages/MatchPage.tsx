import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router'
import type { MatchErrorReason } from '../../shared/protocol.ts'
import { AttackFx } from '../match/AttackFx.tsx'
import { GameBoard } from '../match/GameBoard.tsx'
import { useServer } from '../net/ServerContext.ts'
import { usePlayer } from '../player/PlayerContext.ts'

const ERROR_MESSAGES: Record<MatchErrorReason, string> = {
  'not-found': 'Partida não encontrada. O convite pode ter expirado ou sido cancelado.',
  full: 'Esta partida já está completa.',
}

// Keyed by match id so per-match state resets when the URL changes.
export function MatchPage() {
  const { matchId = '' } = useParams()
  return <MatchView key={matchId} matchId={matchId} />
}

function MatchView({ matchId }: { matchId: string }) {
  const { player } = usePlayer()
  const { status, currentMatch, game, send, subscribe } = useServer()
  const location = useLocation()
  const [error, setError] = useState<MatchErrorReason | null>(null)
  const [ended, setEnded] = useState(false)

  const match = currentMatch?.id === matchId ? currentMatch : null
  const view = game?.matchId === matchId ? game : null

  useEffect(
    () =>
      subscribe((msg) => {
        if (msg.type === 'match-error' && msg.matchId === matchId) setError(msg.reason)
        if (msg.type === 'match-ended' && msg.matchId === matchId) setEnded(true)
      }),
    [subscribe, matchId],
  )

  // Opening an invite link (or reloading) joins the match through the server.
  const hasMatch = match !== null
  useEffect(() => {
    if (status === 'open' && !hasMatch && !ended) send({ type: 'join-match', matchId })
  }, [status, hasMatch, ended, matchId, send])

  if (!player) return <Navigate to="/" replace state={{ from: location.pathname }} />

  // The board stays up after the game ends so the result is visible.
  if (view && (match || view.phase === 'over')) {
    // The effect lives outside the board, which remounts every phase, so it plays across the change.
    return (
      <>
        <GameBoard key={`${view.turn}-${view.phase}`} game={view} send={send} />
        <AttackFx
          event={view.lastAttack}
          myId={player.id}
          names={{ [view.me.player.id]: view.me.player.name, [view.opponent.player.id]: view.opponent.player.name }}
        />
      </>
    )
  }

  let content
  if (ended) {
    content = <p>A partida terminou.</p>
  } else if (error) {
    content = <p>{ERROR_MESSAGES[error]}</p>
  } else if (!match) {
    content = <p>{status === 'open' ? 'Aguardando o oponente…' : 'Conectando ao servidor…'}</p>
  } else {
    content = <p>Preparando a partida…</p>
  }

  return (
    <main className="home">
      <section className="panel">
        <h1>Partida</h1>
        {content}
        {(ended || error || !match) && <Link to="/home">Voltar para o início</Link>}
      </section>
    </main>
  )
}
