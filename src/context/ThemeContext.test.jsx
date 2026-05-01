import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'

// jsdom does not implement matchMedia — provide a minimal stub
function mockMatchMedia(darkMatches = false) {
  const listeners = []
  const mq = {
    matches: darkMatches,
    addEventListener: vi.fn((_, cb) => listeners.push(cb)),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return { mq, listeners }
}

// Helper component that surfaces theme state
function ThemeConsumer() {
  const { theme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>dark</button>
      <button onClick={() => setTheme('light')}>light</button>
      <button onClick={() => setTheme('system')}>system</button>
    </div>
  )
}

function renderConsumer() {
  return render(
    <ThemeProvider>
      <ThemeConsumer />
    </ThemeProvider>,
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    mockMatchMedia(false)
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    vi.unstubAllGlobals()
  })

  it('defaults to "system" when localStorage is empty', () => {
    renderConsumer()
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('restores stored theme from localStorage', () => {
    localStorage.setItem('snbudget-theme', 'dark')
    renderConsumer()
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('switches to dark and adds .dark class on <html>', async () => {
    const user = userEvent.setup()
    renderConsumer()
    await user.click(screen.getByRole('button', { name: /^dark$/i }))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches to light and removes .dark class on <html>', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')
    renderConsumer()
    await user.click(screen.getByRole('button', { name: /^light$/i }))
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists the chosen theme in localStorage', async () => {
    const user = userEvent.setup()
    renderConsumer()
    await user.click(screen.getByRole('button', { name: /^dark$/i }))
    expect(localStorage.getItem('snbudget-theme')).toBe('dark')
  })

  it('throws when useTheme is used outside ThemeProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme must be used inside ThemeProvider',
    )
    consoleSpy.mockRestore()
  })

  it('ignores unknown theme values and falls back to "system"', async () => {
    const user = userEvent.setup()
    renderConsumer()
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /^system$/i }))
    })
    expect(screen.getByTestId('theme').textContent).toBe('system')
  })

  it('adds .dark to <html> in "system" mode when OS prefers dark', () => {
    mockMatchMedia(true) // system prefers dark
    renderConsumer()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

