import { Link } from 'react-router'
import { usePlayer } from '../player/PlayerContext.ts'
import { Rules } from '../rules/Rules.tsx'

// Public: no login needed, so new players can read the rules first.
export function RulesPage() {
  const { player } = usePlayer()
  return (
    <main className="home">
      <section className="panel">
        <h1>Como jogar</h1>
        <Rules />
      </section>
      <Link to={player ? '/home' : '/'}>Voltar</Link>
    </main>
  )
}
