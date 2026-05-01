import '@testing-library/jest-dom/vitest'
import { afterEach, beforeAll, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom does not implement window.matchMedia — provide a minimal stub
// so any component that calls matchMedia in tests doesn't throw.
beforeAll(() => {
  if (typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    })
  }
})

// Default `fetch` to a rejecting stub so AuthProvider's silent refresh
// (and any other accidental network call) cannot reach the real backend
// during tests. Individual tests can override via `vi.spyOn(global, 'fetch')`.
beforeEach(() => {
  globalThis.fetch = vi.fn(() => Promise.reject(new Error('network disabled in tests')))
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
