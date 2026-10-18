import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import type { GameView } from '../../shared/game.ts'
import type { Player } from '../../shared/player.ts'
import {
  WS_PATH,
  type ClientMessage,
  type MatchInfo,
  type OnlineUser,
  type ServerMessage,
} from '../../shared/protocol.ts'
import { usePlayer } from '../player/PlayerContext.ts'
import { ServerContext, type ConnectionStatus, type ServerListener } from './ServerContext.ts'

const MAX_RETRY_DELAY_MS = 10_000

function socketUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${location.host}${WS_PATH}`
}

// Keeps one WebSocket open while a player is logged in, reconnecting on drops.
// Must sit inside the router: a 'match-start' message navigates to the match page.
export function ServerProvider({ children }: { children: ReactNode }) {
  const { player } = usePlayer()
  const navigate = useNavigate()
  const navigateRef = useRef(navigate)
  const socketRef = useRef<WebSocket | null>(null)
  const listenersRef = useRef(new Set<ServerListener>())

  const [status, setStatus] = useState<ConnectionStatus>('closed')
  const [users, setUsers] = useState<OnlineUser[]>([])
  const [invites, setInvites] = useState<Player[]>([])
  const [currentMatch, setCurrentMatch] = useState<MatchInfo | null>(null)
  const [game, setGame] = useState<GameView | null>(null)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    if (!player) return
    const me = player
    let disposed = false
    let retryTimer: number | undefined
    let retryDelay = 1000

    function handle(msg: ServerMessage) {
      switch (msg.type) {
        case 'users':
          setUsers(msg.users.filter((u) => u.id !== me.id))
          break
        case 'invite-received':
          setInvites((prev) =>
            prev.some((p) => p.id === msg.from.id) ? prev : [...prev, msg.from],
          )
          break
        case 'match-start':
          setCurrentMatch(msg.match)
          setInvites([])
          navigateRef.current(`/match/${msg.match.id}`)
          break
        case 'game-state':
          setGame(msg.state)
          break
        case 'match-ended':
          setCurrentMatch((m) => (m?.id === msg.matchId ? null : m))
          break
      }
      for (const listener of listenersRef.current) listener(msg)
    }

    function connect() {
      setStatus('connecting')
      const socket = new WebSocket(socketUrl())
      socketRef.current = socket

      socket.onopen = () => {
        retryDelay = 1000
        socket.send(JSON.stringify({ type: 'hello', player: me } satisfies ClientMessage))
        setStatus('open')
      }
      socket.onmessage = (event) => {
        try {
          handle(JSON.parse(event.data as string) as ServerMessage)
        } catch {
          // ignore malformed messages
        }
      }
      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null
        if (disposed) return
        setStatus('closed')
        retryTimer = window.setTimeout(connect, retryDelay)
        retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY_MS)
      }
    }

    connect()

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      socketRef.current?.close()
      socketRef.current = null
      setStatus('closed')
      setUsers([])
      setInvites([])
      setCurrentMatch(null)
      setGame(null)
    }
  }, [player])

  const send = useCallback((msg: ClientMessage) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(msg))
  }, [])

  const subscribe = useCallback((listener: ServerListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const dismissInvite = useCallback((fromId: string) => {
    setInvites((prev) => prev.filter((p) => p.id !== fromId))
  }, [])

  const value = useMemo(
    () => ({ status, users, invites, currentMatch, game, send, subscribe, dismissInvite }),
    [status, users, invites, currentMatch, game, send, subscribe, dismissInvite],
  )

  return <ServerContext value={value}>{children}</ServerContext>
}
