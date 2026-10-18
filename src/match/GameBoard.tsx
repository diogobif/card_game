import { useState } from 'react'
import { Link } from 'react-router'
import { MAX_FIELD, MAX_TURNS, type GameView } from '../../shared/game.ts'
import type { Team } from '../../shared/player.ts'
import type { ClientMessage } from '../../shared/protocol.ts'
import { TeamBadge } from '../components/TeamBadge.tsx'
import { TEAM_LABELS } from '../player/teams.ts'
import { Rules } from '../rules/Rules.tsx'
import { CharacterCardView, SupportCardView } from './GameCards.tsx'
import { END_REASON_LABELS } from './labels.ts'
import { useCountdown } from './useCountdown.ts'
import './GameBoard.css'

type Props = {
  game: GameView
  send: (msg: ClientMessage) => void
}

// Remount per turn phase (key it on turn + phase) so selections reset between phases.
export function GameBoard({ game, send }: Props) {
  const { me, opponent, phase } = game
  const seconds = useCountdown(game.timeLeftMs, game)
  const [handPick, setHandPick] = useState<string | null>(null)
  const [useSupport, setUseSupport] = useState(false)
  const [attackerPick, setAttackerPick] = useState<string | null>(null)
  const [targetPick, setTargetPick] = useState<string | null>(null)

  const fieldFull = me.field.length >= MAX_FIELD
  const choosing = phase === 'choose' && !me.hasChosen && me.hand.length > 0 && !fieldFull
  const myAttack = phase === 'attack' && game.attackerId === me.player.id
  const directAttack = opponent.field.length === 0

  function confirmCard() {
    if (!handPick) return
    send({ type: 'play-card', matchId: game.matchId, cardId: handPick, useSupport })
  }

  // Stays on the board so the player sees the result.
  function giveUp() {
    if (window.confirm('Desistir da partida? Você será declarado perdedor.')) {
      send({ type: 'leave-match', matchId: game.matchId })
    }
  }

  function confirmAttack() {
    if (!attackerPick || (!targetPick && !directAttack)) return
    send({
      type: 'attack',
      matchId: game.matchId,
      attackerCardId: attackerPick,
      targetCardId: directAttack ? null : targetPick,
    })
  }

  let status: string
  if (phase === 'over') status = 'Fim de jogo.'
  else if (phase === 'choose') {
    status = me.hasChosen
      ? 'Aguardando o oponente escolher…'
      : me.hand.length === 0
        ? 'Você não tem cartas na mão.'
        : fieldFull
          ? `Sua arena está cheia (${MAX_FIELD} personagens); aguarde o oponente.`
        : 'Escolha uma carta da sua mão.'
  } else if (myAttack) {
    status = directAttack
      ? 'Sua vez de atacar: o oponente não tem personagens, ataque direto!'
      : 'Sua vez de atacar: escolha seu personagem e depois o alvo.'
  } else status = 'O oponente está escolhendo o ataque…'

  return (
    <main className="board">
      <header className="board-top panel">
        <div>
          <strong>{game.arena.name}</strong>{' '}
          {game.arena.favors ? (
            <span className={`team-badge team-badge-${game.arena.favors}`}>
              +1/+1 {TEAM_LABELS[game.arena.favors]}
            </span>
          ) : (
            <span className="board-tag">Neutra</span>
          )}
        </div>
        <div className="board-top-stats">
          <span>
            Turno {game.turn}/{MAX_TURNS}
          </span>
          <span>Baralho: {game.deckCount}</span>
        </div>
      </header>

      {game.result && (
        <section className="panel board-result">
          <h2>
            {game.result.winnerId === null
              ? 'Empate!'
              : game.result.winnerId === me.player.id
                ? 'Você venceu!'
                : 'Você perdeu.'}
          </h2>
          <p>
            {game.result.reason === 'forfeit' && game.result.winnerId === me.player.id
              ? 'O oponente desistiu da partida.'
              : game.result.reason === 'forfeit'
                ? 'Você desistiu da partida.'
                : game.result.reason === 'disconnect' && game.result.winnerId === me.player.id
                  ? 'O oponente ficou desconectado por mais de 60 segundos.'
                  : END_REASON_LABELS[game.result.reason]}
          </p>
          <Link to="/home" className="btn">
            Voltar para o início
          </Link>
        </section>
      )}

      <section className="board-side">
        <PlayerBar
          name={opponent.player.name}
          team={opponent.player.team}
          life={opponent.life}
          extra={`Mão: ${opponent.handCount} · Suporte: ${opponent.supportUsed ? 'usado' : 'disponível'}${
            phase === 'choose' && opponent.hasChosen ? ' · pronto' : ''
          }`}
        />
        <div className="board-field">
          {opponent.field.length === 0 && <p className="board-empty">Nenhum personagem na arena.</p>}
          {opponent.field.map((f) => (
            <CharacterCardView
              key={f.card.id}
              card={f.card}
              attack={f.attack}
              resistance={f.resistance}
              selected={targetPick === f.card.id}
              onSelect={myAttack && attackerPick ? () => setTargetPick(f.card.id) : undefined}
            />
          ))}
        </div>
      </section>

      {game.turnSupports.length > 0 && (
        <section className="board-supports">
          <h3>Suportes deste turno</h3>
          <div className="board-field">
            {game.turnSupports.map((s) => (
              <SupportCardView key={s.support.id} card={s.support} />
            ))}
          </div>
        </section>
      )}

      <section className="board-side board-side-mine">
        <div className="board-field">
          {me.field.length === 0 && <p className="board-empty">Nenhum personagem na arena.</p>}
          {me.field.map((f) => (
            <CharacterCardView
              key={f.card.id}
              card={f.card}
              attack={f.attack}
              resistance={f.resistance}
              selected={attackerPick === f.card.id}
              onSelect={myAttack ? () => setAttackerPick(f.card.id) : undefined}
            />
          ))}
        </div>
        <PlayerBar name={`${me.player.name} (você)`} team={me.player.team} life={me.life} />
      </section>

      <section className="panel board-hand">
        <h2>Sua mão</h2>
        <div className="board-field">
          {me.hand.map((card) => (
            <CharacterCardView
              key={card.id}
              card={card}
              selected={handPick === card.id}
              onSelect={choosing ? () => setHandPick(card.id) : undefined}
            />
          ))}
          <div className="board-support-slot">
            <SupportCardView card={me.support} />
            {me.supportUsed ? (
              <span className="board-tag">Usado</span>
            ) : (
              <label>
                <input
                  type="checkbox"
                  checked={useSupport}
                  disabled={!choosing}
                  onChange={(e) => setUseSupport(e.target.checked)}
                />{' '}
                Usar neste turno
              </label>
            )}
          </div>
        </div>
        {choosing && useSupport && (
          <p className="board-note">O suporte só pode ser usado uma vez por partida.</p>
        )}
      </section>

      <section className="panel board-log">
        <h2>Histórico</h2>
        <ol>
          {game.log.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </section>

      {/* Collapsible so the rules can be read without leaving the match. */}
      <details className="panel board-rules">
        <summary>Como jogar</summary>
        <Rules />
      </details>

      {phase !== 'over' && (
        <button type="button" className="btn btn-ghost board-leave" onClick={giveUp}>
          Desistir da partida
        </button>
      )}

      {/* Last child + sticky: stays pinned to the bottom of the screen while scrolling. */}
      {phase !== 'over' && (
        <div className="board-dock">
          <p className="board-status">
            <span className={seconds <= 10 ? 'board-timer is-low' : 'board-timer'}>⏱ {seconds}s</span>{' '}
            {status}
          </p>
          {choosing && (
            <button type="button" className="btn" disabled={!handPick} onClick={confirmCard}>
              Confirmar carta
            </button>
          )}
          {myAttack && (
            <button
              type="button"
              className="btn"
              disabled={!attackerPick || (!targetPick && !directAttack)}
              onClick={confirmAttack}
            >
              {directAttack ? 'Atacar diretamente' : 'Atacar'}
            </button>
          )}
        </div>
      )}
    </main>
  )
}

type PlayerBarProps = {
  name: string
  team: Team
  life: number
  extra?: string
}

function PlayerBar({ name, team, life, extra }: PlayerBarProps) {
  return (
    <div className="board-player">
      <strong>{name}</strong> <TeamBadge team={team} />
      <span className="board-life">❤ {life}</span>
      {extra && <span className="board-extra">{extra}</span>}
    </div>
  )
}
