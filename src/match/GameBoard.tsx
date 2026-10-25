import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router'
import { resolveAttack, type AttackOutcome } from '../../shared/combat.ts'
import { MAX_FIELD, MAX_TURNS, START_LIFE, type FieldCard, type GameView } from '../../shared/game.ts'
import type { Team } from '../../shared/player.ts'
import type { ClientMessage } from '../../shared/protocol.ts'
import { TeamBadge } from '../components/TeamBadge.tsx'
import { initialsOf } from '../player/initials.ts'
import { TEAM_LABELS } from '../player/teams.ts'
import { Rules } from '../rules/Rules.tsx'
import { CharacterCardView, SupportCardView, type CardState } from './GameCards.tsx'
import {
  ArrowIcon,
  CardsIcon,
  CheckIcon,
  ClockIcon,
  HeartIcon,
  PlusIcon,
  PointerIcon,
  SwordIcon,
  TargetIcon,
} from './icons.tsx'
import { END_REASON_LABELS } from './labels.ts'
import { isMuted, setMuted, subscribeMuted } from './sfx.ts'
import { useCountdown } from './useCountdown.ts'
import './GameBoard.css'

type Props = {
  game: GameView
  send: (msg: ClientMessage) => void
}

const STEPS = ['Escolher', 'Revelar', 'Atacar'] as const

type Banner = {
  /** 'action': the player must do something now. 'wait': nothing to do. */
  tone: 'action' | 'wait'
  /** Index into STEPS. */
  step: number
  icon: ReactNode
  eyebrow: string
  title: string
  text: string
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
  const pickingTarget = myAttack && attackerPick !== null && !directAttack
  const needsAction = choosing || myAttack

  const handCard = me.hand.find((c) => c.id === handPick) ?? null
  const attacker = me.field.find((f) => f.card.id === attackerPick) ?? null
  const target = opponent.field.find((f) => f.card.id === targetPick) ?? null
  const outcome =
    attacker && (target || directAttack)
      ? resolveAttack(game.turnSupports, me.player.id, attacker, opponent.player.id, target)
      : null

  // A short "your turn" pop-up, plus a tab title that stays flagged while the player must act.
  // Right after an attack the pop-up waits for the clash animation (AttackFx) to finish.
  const afterClash = phase === 'choose' && game.lastAttack?.turn === game.turn - 1
  const toastDelay = afterClash ? 2300 : 0
  const [toast, setToast] = useState(needsAction)
  useEffect(() => {
    if (!needsAction) return
    const baseTitle = document.title
    document.title = `(!) Sua vez · ${baseTitle}`
    const id = window.setTimeout(() => setToast(false), 2200 + toastDelay)
    return () => {
      window.clearTimeout(id)
      document.title = baseTitle
    }
  }, [needsAction, toastDelay])

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

  function pickAttacker(cardId: string) {
    setAttackerPick(cardId)
    setTargetPick(null)
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

  const banner = bannerFor()
  function bannerFor(): Banner | null {
    if (phase === 'over') return null
    if (phase === 'choose') {
      if (choosing) {
        return {
          tone: 'action',
          step: 0,
          icon: <CardsIcon size={28} />,
          eyebrow: 'Sua vez',
          title: 'Escolha 1 personagem da sua mão',
          text: 'Ele entra na sua arena. As cartas dos dois jogadores são reveladas ao mesmo tempo.',
        }
      }
      const wait = { tone: 'wait', step: 0, icon: <ClockIcon size={28} /> } as const
      if (me.hasChosen) {
        return {
          ...wait,
          eyebrow: 'Carta escolhida',
          title: `Aguardando ${opponent.player.name} escolher`,
          text: 'As cartas serão reveladas quando os dois jogadores escolherem.',
        }
      }
      if (me.hand.length === 0) {
        return { ...wait, eyebrow: 'Sem cartas', title: 'Você não tem cartas na mão', text: 'Aguarde o oponente.' }
      }
      return {
        ...wait,
        eyebrow: 'Arena cheia',
        title: `Sua arena já tem ${MAX_FIELD} personagens`,
        text: 'Você não joga carta neste turno, até um dos seus personagens sair da arena.',
      }
    }
    if (!myAttack) {
      return {
        tone: 'wait',
        step: 2,
        icon: <ClockIcon size={28} />,
        eyebrow: 'Vez do oponente',
        title: `${opponent.player.name} está escolhendo o ataque`,
        text: 'Qualquer personagem da sua arena pode ser atacado. Você ataca no próximo turno.',
      }
    }
    if (directAttack) {
      return {
        tone: 'action',
        step: 2,
        icon: <SwordIcon size={28} />,
        eyebrow: 'Sua vez de atacar',
        title: attacker ? 'Confirme o ataque direto' : 'Escolha qual dos seus personagens vai atacar',
        text: 'O oponente não tem personagens na arena: o ataque vai direto nos pontos de vida.',
      }
    }
    if (!attacker) {
      return {
        tone: 'action',
        step: 2,
        icon: <SwordIcon size={28} />,
        eyebrow: 'Sua vez de atacar · Passo 1 de 2',
        title: 'Escolha qual dos seus personagens vai atacar',
        text: 'Qualquer personagem da sua arena pode atacar, não só o que acabou de entrar. É 1 ataque por turno.',
      }
    }
    return {
      tone: 'action',
      step: 2,
      icon: <TargetIcon size={28} />,
      eyebrow: 'Sua vez de atacar · Passo 2 de 2',
      title: 'Agora escolha o personagem do oponente que vai sofrer o ataque',
      text: 'Veja o resultado logo abaixo antes de confirmar.',
    }
  }

  function myFieldState(f: FieldCard): CardState {
    if (!myAttack) return 'idle'
    if (f.card.id === attackerPick) return 'selected'
    return attackerPick ? 'idle' : 'playable'
  }

  function opponentFieldState(f: FieldCard): CardState {
    if (!pickingTarget) return 'idle'
    return f.card.id === targetPick ? 'targeted' : 'target'
  }

  const newTag = (f: FieldCard) => (f.placedTurn === game.turn ? 'Nova' : undefined)

  return (
    <main className="board">
      <header className="board-top panel">
        <div className="board-arena">
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
          <strong>
            Turno {game.turn} de {MAX_TURNS}
          </strong>
          <span>
            Seu baralho: {me.deckCount} · Oponente: {opponent.deckCount}
          </span>
          <SoundToggle />
          {phase !== 'over' && (
            <button type="button" className="btn btn-ghost board-leave" onClick={giveUp}>
              Desistir
            </button>
          )}
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

      {banner && <TurnBanner banner={banner} seconds={seconds} />}

      <div className="board-main">
        <div className="board-play">
          <section
            className={`board-zone${pickingTarget ? ' is-targeting' : ''}`}
            aria-label="Arena do oponente"
          >
            <PlayerBar
              name={opponent.player.name}
              initials={initialsOf(opponent.player.name)}
              team={opponent.player.team}
              life={opponent.life}
              lifeLoss={outcome?.lifeDamage ?? 0}
              extra={`Mão: ${opponent.handCount} · Suporte ${opponent.supportUsed ? 'usado' : 'disponível'}`}
              status={
                phase === 'choose'
                  ? opponent.hasChosen
                    ? { label: 'Pronto', tone: 'done' }
                    : { label: 'Escolhendo…', tone: 'idle' }
                  : phase === 'attack' && !myAttack
                    ? { label: 'Atacando', tone: 'alert' }
                    : undefined
              }
            />
            <div className="board-zone-cards">
              <ZoneLabel tone={pickingTarget ? 'target' : undefined}>
                {pickingTarget ? (
                  <>
                    <TargetIcon size={14} /> Arena do oponente · clique no alvo
                  </>
                ) : (
                  `Arena do oponente · ${opponent.field.length} de ${MAX_FIELD}`
                )}
              </ZoneLabel>
              <div className="board-field">
                {opponent.field.map((f) => {
                  const state = opponentFieldState(f)
                  return (
                    <CharacterCardView
                      key={f.card.id}
                      card={f.card}
                      attack={f.attack}
                      resistance={f.resistance}
                      state={state}
                      tag={state === 'targeted' ? 'Alvo' : newTag(f)}
                      onSelect={pickingTarget ? () => setTargetPick(f.card.id) : undefined}
                    />
                  )
                })}
                <EmptySlots count={MAX_FIELD - opponent.field.length} />
              </div>
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

          <section
            className={`board-zone${myAttack && !attacker ? ' is-active' : ''}`}
            aria-label="Sua arena"
          >
            <PlayerBar
              name="Você"
              initials="EU"
              team={me.player.team}
              life={me.life}
              extra={`${me.player.name} · Suporte ${me.supportUsed ? 'usado' : 'disponível'}`}
            />
            <div className="board-zone-cards">
              <ZoneLabel tone={myAttack && !attacker ? 'action' : undefined}>
                {myAttack && !attacker ? (
                  <>
                    <PointerIcon size={14} /> Sua arena · clique no personagem que vai atacar
                  </>
                ) : myAttack ? (
                  'Sua arena · clique em outro para trocar o atacante'
                ) : (
                  `Sua arena · ${me.field.length} de ${MAX_FIELD}`
                )}
              </ZoneLabel>
              <div className="board-field">
                {me.field.map((f) => {
                  const state = myFieldState(f)
                  return (
                    <CharacterCardView
                      key={f.card.id}
                      card={f.card}
                      attack={f.attack}
                      resistance={f.resistance}
                      state={state}
                      tag={state === 'selected' ? 'Atacante' : newTag(f)}
                      onSelect={myAttack ? () => pickAttacker(f.card.id) : undefined}
                    />
                  )
                })}
                <EmptySlots
                  count={MAX_FIELD - me.field.length}
                  incoming={choosing ? (handCard?.name ?? '') : undefined}
                />
              </div>
            </div>
          </section>

          <section className={`panel board-hand${choosing ? ' is-active' : ''}`} aria-label="Sua mão">
            <div className="board-hand-head">
              <h2>Sua mão</h2>
              <span className={choosing ? 'board-hint is-action' : 'board-hint'}>
                {choosing ? (
                  <>
                    <PointerIcon size={16} /> Clique em uma carta para selecioná-la. Você pode trocar até
                    confirmar.
                  </>
                ) : phase === 'attack' ? (
                  'Você joga uma carta da mão no próximo turno.'
                ) : null}
              </span>
            </div>
            <div className="board-field board-hand-cards">
              {me.hand.map((card) => (
                <CharacterCardView
                  key={card.id}
                  card={card}
                  state={choosing ? (handPick === card.id ? 'selected' : 'playable') : myAttack ? 'dim' : 'idle'}
                  tag={choosing && handPick === card.id ? 'Selecionada' : undefined}
                  onSelect={choosing ? () => setHandPick(card.id) : undefined}
                />
              ))}
              <div className="board-support-slot">
                <SupportCardView card={me.support} used={me.supportUsed} dim={myAttack} />
                {me.supportUsed ? null : (
                  <label className="board-support-toggle">
                    <input
                      type="checkbox"
                      checked={useSupport}
                      disabled={!choosing}
                      onChange={(e) => setUseSupport(e.target.checked)}
                    />
                    Usar neste turno
                  </label>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className="board-aside">
          <TurnGuide step={banner?.step ?? -1} myAttackTurn={phase === 'attack' ? myAttack : null} />
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
            <summary>Todas as regras</summary>
            <Rules />
          </details>
        </aside>
      </div>

      {/* Last child + sticky: stays pinned to the bottom of the screen while scrolling. */}
      {phase !== 'over' && (
        <div className="board-dock">
          <span className={seconds <= 10 ? 'board-dock-timer is-low' : 'board-dock-timer'}>
            <ClockIcon size={14} /> {seconds}s
          </span>
          {choosing ? (
            <>
              <div className="board-dock-summary">
                <span className="board-dock-label">Sua jogada</span>
                {handCard ? (
                  <span>
                    <strong>{handCard.name}</strong> (força {handCard.attack} · resistência{' '}
                    {handCard.resistance}) · {useSupport ? 'com suporte' : 'sem suporte'}
                  </span>
                ) : (
                  <span className="is-action">Escolha uma carta da sua mão</span>
                )}
              </div>
              <button type="button" className="btn btn-action" disabled={!handCard} onClick={confirmCard}>
                {handCard ? `Jogar ${handCard.name}` : 'Jogar carta'}
              </button>
            </>
          ) : myAttack ? (
            <>
              <AttackSummary
                attacker={attacker}
                target={target}
                direct={directAttack}
                opponentName={opponent.player.name}
                opponentLife={opponent.life}
                outcome={outcome}
              />
              <div className="board-dock-actions">
                {attacker && (
                  <button type="button" className="btn btn-ghost" onClick={() => {
                      setAttackerPick(null)
                      setTargetPick(null)
                    }}
                  >
                    Trocar atacante
                  </button>
                )}
                <button type="button" className="btn btn-action" disabled={!outcome} onClick={confirmAttack}>
                  {directAttack ? 'Atacar diretamente' : 'Confirmar ataque'}
                </button>
              </div>
            </>
          ) : (
            <p className="board-dock-summary">{banner?.title}</p>
          )}
        </div>
      )}

      {toast && (
        <div className="board-toast" role="status" style={{ animationDelay: `${toastDelay}ms` }}>
          {myAttack ? 'Sua vez de atacar!' : 'Sua vez! Escolha um personagem'}
        </div>
      )}
    </main>
  )
}

function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted)
  return (
    <button
      type="button"
      className="btn btn-ghost board-sound"
      onClick={() => setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som' : 'Desativar som'}
      title={muted ? 'Ativar som' : 'Desativar som'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4V5z" />
        {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
      </svg>
    </button>
  )
}

function TurnBanner({ banner, seconds }: { banner: Banner; seconds: number }) {
  return (
    <section className={`board-banner is-${banner.tone}`} aria-live="polite">
      <span className="board-banner-icon">{banner.icon}</span>
      <div className="board-banner-text">
        <span className="board-banner-eyebrow">{banner.eyebrow}</span>
        <h1>{banner.title}</h1>
        <p>{banner.text}</p>
      </div>
      <ol className="board-steps" aria-label="Etapas do turno">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === banner.step ? 'is-current' : i < banner.step ? 'is-done' : undefined}
            aria-current={i === banner.step ? 'step' : undefined}
          >
            {i < banner.step ? <CheckIcon size={13} /> : `${i + 1} `}
            {label}
          </li>
        ))}
      </ol>
      <div className={seconds <= 10 ? 'board-banner-timer is-low' : 'board-banner-timer'}>
        <strong>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </strong>
        <span>{banner.tone === 'action' ? 'restantes' : 'aguardando'}</span>
      </div>
    </section>
  )
}

function TurnGuide({ step, myAttackTurn }: { step: number; myAttackTurn: boolean | null }) {
  const items = [
    ['Escolha 1 personagem.', 'Os dois jogadores escolhem ao mesmo tempo.'],
    ['Revelação.', 'As cartas aparecem nas arenas.'],
    [
      'Ataque.',
      myAttackTurn === false
        ? 'Neste turno quem ataca é o oponente. No próximo, é você.'
        : 'Um jogador escolhe um atacante e um alvo. A vez de atacar alterna a cada turno.',
    ],
  ]
  return (
    <section className="panel board-guide">
      <h2>Como funciona um turno</h2>
      <ol>
        {items.map(([title, text], i) => (
          <li key={title} className={i === step ? 'is-current' : undefined}>
            <span className="board-guide-num">{i + 1}</span>
            <span>
              <strong>{title}</strong> {text}
            </span>
          </li>
        ))}
      </ol>
      {myAttackTurn && (
        <>
          <h3>Como o ataque funciona</h3>
          <ul>
            <li>O alvo perde resistência igual à força do seu atacante.</li>
            <li>Seu atacante perde força igual à resistência do alvo.</li>
            <li>Se o alvo cair, o dano que sobrar vai direto na vida do oponente.</li>
          </ul>
        </>
      )}
    </section>
  )
}

type AttackSummaryProps = {
  attacker: FieldCard | null
  target: FieldCard | null
  direct: boolean
  opponentName: string
  opponentLife: number
  outcome: AttackOutcome | null
}

function AttackSummary({ attacker, target, direct, opponentName, opponentLife, outcome }: AttackSummaryProps) {
  const effects: { text: string; tone: 'good' | 'bad' | 'neutral' }[] = []
  if (outcome && attacker) {
    if (target) {
      effects.push(
        outcome.targetResistance === null
          ? { text: `${target.card.name} sai da arena`, tone: 'good' }
          : { text: `${target.card.name} fica com resistência ${outcome.targetResistance}`, tone: 'good' },
      )
    }
    if (outcome.lifeDamage > 0) {
      const after = Math.max(0, opponentLife - outcome.lifeDamage)
      effects.push({
        text: `${outcome.lifeDamage} de dano em ${opponentName} (${opponentLife} → ${after})`,
        tone: 'good',
      })
    }
    if (target) {
      effects.push(
        outcome.attackerAttack === null
          ? { text: `${attacker.card.name} também sai da arena`, tone: 'bad' }
          : { text: `${attacker.card.name} fica com força ${outcome.attackerAttack}`, tone: 'neutral' },
      )
    }
  }
  return (
    <div className="board-dock-summary">
      <div className="board-attack-line">
        <span>
          <span className="board-dock-label">Atacante</span>
          {attacker ? (
            <strong>
              {attacker.card.name} ({outcome?.power ?? attacker.attack})
            </strong>
          ) : (
            <span className="is-action">Escolha na sua arena</span>
          )}
        </span>
        <ArrowIcon size={20} />
        <span>
          <span className="board-dock-label">Alvo</span>
          {direct ? (
            <strong>Vida de {opponentName}</strong>
          ) : target ? (
            <strong>
              {target.card.name} ({outcome?.guard ?? target.resistance})
            </strong>
          ) : (
            <span className={attacker ? 'is-action' : 'is-muted'}>
              {attacker ? 'Escolha na arena do oponente' : 'depois do atacante'}
            </span>
          )}
        </span>
      </div>
      {effects.length > 0 && (
        <ul className="board-effects" aria-label="Resultado do ataque">
          {effects.map((e) => (
            <li key={e.text} className={`is-${e.tone}`}>
              {e.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ZoneLabel({ tone, children }: { tone?: 'action' | 'target'; children: ReactNode }) {
  return <span className={`board-zone-label${tone ? ` is-${tone}` : ''}`}>{children}</span>
}

/** Open arena positions, so the 3-character limit is visible; `incoming` previews the picked card. */
function EmptySlots({ count, incoming }: { count: number; incoming?: string }) {
  return Array.from({ length: Math.max(0, count) }, (_, i) =>
    i === 0 && incoming !== undefined ? (
      <div key={i} className="board-slot is-incoming">
        <PlusIcon size={22} />
        <span>{incoming ? `${incoming} entra aqui` : 'Sua carta entra aqui'}</span>
      </div>
    ) : (
      <div key={i} className="board-slot">
        Vaga livre
      </div>
    ),
  )
}

type PlayerBarProps = {
  name: string
  initials: string
  team: Team
  life: number
  /** Life the pending attack would take away, shown on the bar. */
  lifeLoss?: number
  extra: string
  status?: { label: string; tone: 'idle' | 'done' | 'alert' }
}

function PlayerBar({ name, initials, team, life, lifeLoss = 0, extra, status }: PlayerBarProps) {
  const loss = Math.min(life, lifeLoss)
  return (
    <div className="board-player">
      <div className="board-player-id">
        <span className={`board-avatar board-avatar-${team}`}>{initials}</span>
        <span>
          <strong>{name}</strong>
          <TeamBadge team={team} />
        </span>
      </div>
      <div className="board-life">
        <HeartIcon /> <strong>{life}</strong> / {START_LIFE} vida
      </div>
      <div className={`board-life-bar board-life-bar-${team}`} aria-hidden="true">
        <span style={{ width: `${((life - loss) / START_LIFE) * 100}%` }} />
        {loss > 0 && <span className="is-loss" style={{ width: `${(loss / START_LIFE) * 100}%` }} />}
      </div>
      {loss > 0 && <span className="board-life-loss">Perderá {loss} de vida</span>}
      <span className="board-extra">{extra}</span>
      {status && <span className={`board-status-chip is-${status.tone}`}>{status.label}</span>}
    </div>
  )
}
