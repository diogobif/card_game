/** Two tilted cards, one per team, plus the game name. */
export function Logo({ size = 'md', as: Tag = 'span' }: { size?: 'md' | 'lg'; as?: 'span' | 'h1' }) {
  return (
    <span className={`logo logo-${size}`}>
      <span className="logo-cards" aria-hidden="true">
        <span />
        <span />
      </span>
      <Tag className="logo-name">Card Game</Tag>
    </span>
  )
}
