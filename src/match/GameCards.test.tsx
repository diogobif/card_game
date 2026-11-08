import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { CharacterCard, SupportCard } from '../../shared/cards.ts'
import { CharacterCardView, SupportCardView } from './GameCards.tsx'

const CARD: CharacterCard = {
  id: 'tio-do-zap',
  name: 'Tio do Zap',
  category: 'influenciador',
  team: 'blue',
  attack: 3,
  resistance: 6,
  image: '/images/tio-do-zap.svg',
}

const SUPPORT: SupportCard = {
  id: 'corrente-de-oracao',
  name: 'Corrente de Oração',
  team: 'blue',
  image: '/images/corrente.svg',
  boost: { category: 'religioso', stat: 'resistance', amount: 2 },
  penalty: { category: 'intelectual', stat: 'attack', amount: 1 },
}

describe('CharacterCardView', () => {
  it('shows name, category and printed stats as a static image when not clickable', () => {
    render(<CharacterCardView card={CARD} />)
    const card = screen.getByRole('img', { name: 'Tio do Zap, força 3, resistência 6' })
    expect(card).toHaveTextContent('Influenciador')
    expect(card).toHaveClass('game-card-blue', 'is-idle')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('becomes a button that calls onSelect when clicked', async () => {
    const onSelect = vi.fn()
    render(<CharacterCardView card={CARD} state="playable" onSelect={onSelect} />)
    const button = screen.getByRole('button', { name: /Tio do Zap/ })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it.each(['selected', 'targeted'] as const)('is pressed when %s', (state) => {
    render(<CharacterCardView card={CARD} state={state} onSelect={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows current field stats, marks changes and strikes the printed value', () => {
    const { container } = render(<CharacterCardView card={CARD} attack={5} resistance={2} />)
    expect(screen.getByRole('img')).toHaveAccessibleName('Tio do Zap, força 5, resistência 2')
    expect(container.querySelector('.is-atk strong')).toHaveClass('stat-up')
    expect(container.querySelector('.is-res strong')).toHaveClass('stat-down')
    expect(container.querySelector('.is-atk s')).toHaveTextContent('3')
    expect(container.querySelector('.is-res s')).toHaveTextContent('6')
  })

  it('shows the tag under the card', () => {
    render(<CharacterCardView card={CARD} tag="Alvo" />)
    expect(screen.getByText('Alvo')).toBeInTheDocument()
  })
})

describe('SupportCardView', () => {
  it('describes the boost for your type and the penalty for the rival type', () => {
    render(<SupportCardView card={SUPPORT} />)
    expect(screen.getByText('Corrente de Oração')).toBeInTheDocument()
    expect(screen.getByText('+2 resistência')).toBeInTheDocument()
    expect(screen.getByText('Seus: Religioso')).toBeInTheDocument()
    expect(screen.getByText('−1 força')).toBeInTheDocument()
    expect(screen.getByText('Rival: Intelectual')).toBeInTheDocument()
    expect(screen.queryByText('Usado')).not.toBeInTheDocument()
  })

  it('is stamped once used', () => {
    render(<SupportCardView card={SUPPORT} used />)
    expect(screen.getByText('Usado')).toBeInTheDocument()
  })
})
