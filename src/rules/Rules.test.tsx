import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Rules } from './Rules.tsx'

// GET-4: the rules shown to players must state the 900 starting life points.
describe('Rules (GET-4: 900 life points)', () => {
  it('states that the goal is to empty the opponent 900 life points', () => {
    render(<Rules />)
    expect(screen.getByText(/zerar os 900 pontos de vida/)).toBeInTheDocument()
  })

  it('states that each player starts with 900 life points and no longer mentions 20', () => {
    render(<Rules />)
    expect(screen.getByText(/1 carta de suporte e 900\s+pontos de vida/)).toBeInTheDocument()
    expect(screen.queryByText(/\b20 pontos de vida/)).toBeNull()
  })
})
