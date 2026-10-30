import { useId } from 'react'

// Zigzag tear down the middle of the card, top to bottom (64x64 box).
const TEAR = 'L29 14 L35 24 L29 34 L35 44 L29 54 L33 64'
const LEFT_HALF = `M0 0 H34 ${TEAR} H0 Z`
const RIGHT_HALF = `M34 0 H64 V64 H33 L29 54 L35 44 L29 34 L35 24 L29 14 Z`

/** A single card torn in two, one half per team: the discord the game is named after. */
export function LogoMark({ className }: { className?: string }) {
  const clip = useId()
  const half = (path: string, side: 'red' | 'blue') => (
    <g className={`logo-half logo-half-${side}`}>
      <g clipPath={`url(#${clip})`}>
        <path d={path} className="logo-half-fill" />
        <rect x="16" y="8" width="32" height="48" rx="3" className="logo-half-frame" />
      </g>
    </g>
  )

  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clip}>
          <rect x="12" y="4" width="40" height="56" rx="6" />
        </clipPath>
      </defs>
      {half(LEFT_HALF, 'red')}
      {half(RIGHT_HALF, 'blue')}
      <path className="logo-spark" d="M32 4 L33.8 10.2 L40 12 L33.8 13.8 L32 20 L30.2 13.8 L24 12 L30.2 10.2 Z" />
    </svg>
  )
}

/** The torn-card mark plus the game name. */
export function Logo({ size = 'md', as: Tag = 'span' }: { size?: 'md' | 'lg'; as?: 'span' | 'h1' }) {
  return (
    <span className={`logo logo-${size}`}>
      <LogoMark className="logo-mark" />
      <Tag className="logo-name">
        <span className="logo-kicker">Cartas da</span> <span className="logo-title">Discórdia</span>
      </Tag>
    </span>
  )
}
