import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AppShell from './AppShell.jsx'
import * as AuthCtx from '../context/AuthContext.jsx'

function renderShell(initial = '/app/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Routes>
        <Route path="/app" element={<AppShell />}>
          <Route path="dashboard" element={<h1>Dashboard content</h1>} />
        </Route>
        <Route path="/signin" element={<h1>Sign in</h1>} />
        <Route path="/choose-plan" element={<h1>Choose plan</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('redirects to /signin when the user is anonymous', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'anonymous',
      subscriptionStatus: 'unknown',
    })
    renderShell()
    expect(screen.getByRole('heading', { level: 1, name: /sign in/i })).toBeInTheDocument()
  })

  it('redirects to /choose-plan when authenticated but unsubscribed', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'none',
    })
    renderShell()
    expect(screen.getByRole('heading', { level: 1, name: /choose plan/i })).toBeInTheDocument()
  })

  it('renders the sidebar and the routed page when fully authorised', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'active',
    })
    renderShell()
    expect(screen.getByRole('navigation', { name: /primary/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /dashboard content/i })).toBeInTheDocument()
  })

  it('opens and closes the mobile navigation drawer', async () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'active',
    })
    renderShell()

    // Initially the slide-over is not mounted.
    expect(screen.queryByRole('button', { name: /close navigation/i })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /open navigation/i }))
    expect(screen.getByRole('button', { name: /close navigation/i })).toBeInTheDocument()

    // Two Primary navs are now in the DOM (desktop + mobile drawer copy).
    expect(screen.getAllByRole('navigation', { name: /primary/i })).toHaveLength(2)

    await userEvent.click(screen.getByRole('button', { name: /close navigation/i }))
    expect(screen.queryByRole('button', { name: /close navigation/i })).toBeNull()
  })
})

