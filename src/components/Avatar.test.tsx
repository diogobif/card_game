import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { initialsOf } from '../player/initials.ts'
import { Avatar } from './Avatar.tsx'

describe('initialsOf', () => {
  it.each([
    ['Ana', 'AN'],
    ['joão silva', 'JS'],
    ['  Maria   Clara Souza ', 'MC'],
    ['x', 'X'],
  ])('%s -> %s', (name, initials) => {
    expect(initialsOf(name)).toBe(initials)
  })
})

describe('Avatar', () => {
  it('shows the initials in the team color and size, hidden from screen readers', () => {
    const { container } = render(<Avatar name="Bia" team="blue" size="lg" />)
    const avatar = container.firstElementChild
    expect(avatar).toHaveTextContent('BI')
    expect(avatar).toHaveClass('avatar', 'avatar-lg', 'avatar-blue')
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
  })
})
