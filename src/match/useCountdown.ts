import { useEffect, useState } from 'react'

/** Seconds left, counted locally from a server-sent duration; restarts when resetKey changes. */
export function useCountdown(timeLeftMs: number, resetKey: unknown): number {
  const [left, setLeft] = useState(timeLeftMs)

  useEffect(() => {
    const deadline = Date.now() + timeLeftMs
    const tick = () => setLeft(Math.max(0, deadline - Date.now()))
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [timeLeftMs, resetKey])

  return Math.ceil(left / 1000)
}
