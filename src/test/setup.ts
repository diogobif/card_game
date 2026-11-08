// Vitest setup for component tests: DOM matchers (toBeInTheDocument...) and a clean DOM per test.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})
