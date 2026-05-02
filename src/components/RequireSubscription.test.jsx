import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireSubscription from './RequireSubscription.jsx'

// We don't go through AuthProvider here — instead we mock useAuth so each
// test can drive the guard with an exact session shape.
import * as AuthCtx from '../context/AuthContext.jsx'
import { vi } from 'vitest'

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <RequireSubscription>
              <p>members only</p>
            </RequireSubscription>
          }
        />
        <Route path="/choose-plan" element={<h1>Choose your plan</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireSubscription', () => {
  it('renders nothing while subscriptionStatus is "unknown"', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'unknown',
    })
    renderGuard()
    expect(screen.queryByText('members only')).toBeNull()
    expect(screen.queryByRole('heading', { name: /choose your plan/i })).toBeNull()
  })

  it('redirects to /choose-plan when subscriptionStatus is "none"', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'none',
    })
    renderGuard()
    expect(
      screen.getByRole('heading', { level: 1, name: /choose your plan/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText('members only')).toBeNull()
  })

  it('renders children when subscriptionStatus is "active"', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'authenticated',
      subscriptionStatus: 'active',
    })
    renderGuard()
    expect(screen.getByText('members only')).toBeInTheDocument()
  })

  it('renders nothing for unauthenticated sessions (defensive)', () => {
    vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
      status: 'anonymous',
      subscriptionStatus: 'unknown',
    })
    renderGuard()
    expect(screen.queryByText('members only')).toBeNull()
  })
})

