import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext.jsx'
import * as AuthCtxModule from './AuthContext.jsx'

function tokenResponse(overrides = {}) {
  return new Response(
    JSON.stringify({
      accessToken: 'access-1',
      tokenType: 'Bearer',
      expiresIn: 900,
      userId: 'user-uuid',
      ...overrides,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

function Probe() {
  const auth = useAuth()
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="userId">{auth.userId ?? ''}</span>
      <span data-testid="token">{auth.accessToken ?? ''}</span>
      <button onClick={() => auth.login({ identifier: 'a', password: 'b' })}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  )
}

function renderProbe() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('starts in "loading" then drops to "anonymous" when initial refresh fails', async () => {
    globalThis.fetch.mockRejectedValue(new TypeError('no cookie'))
    renderProbe()
    expect(screen.getByTestId('status').textContent).toBe('loading')
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous'),
    )
  })

  it('becomes "authenticated" when initial refresh succeeds', async () => {
    globalThis.fetch.mockResolvedValueOnce(tokenResponse())
    renderProbe()
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated'),
    )
    expect(screen.getByTestId('userId').textContent).toBe('user-uuid')
    expect(screen.getByTestId('token').textContent).toBe('access-1')
  })

  it('login() transitions to authenticated and stores the access token in memory', async () => {
    globalThis.fetch
      // initial refresh fails
      .mockRejectedValueOnce(new TypeError('no cookie'))
      // explicit login succeeds
      .mockResolvedValueOnce(tokenResponse({ accessToken: 'login-token', userId: 'u2' }))

    renderProbe()
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous'),
    )

    await act(async () => {
      screen.getByText('login').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated'),
    )
    expect(screen.getByTestId('token').textContent).toBe('login-token')
    expect(screen.getByTestId('userId').textContent).toBe('u2')

    // Token must NOT be persisted anywhere
    expect(localStorage.getItem('accessToken')).toBeNull()
    expect(sessionStorage.getItem('accessToken')).toBeNull()
  })

  it('logout() calls the API with the bearer token then clears state', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(tokenResponse({ accessToken: 'live-token' }))
      // subscription /me lookup triggered after authentication — return 204
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      // logout response
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    renderProbe()
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated'),
    )

    await act(async () => {
      screen.getByText('logout').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous'),
    )

    const logoutCall = globalThis.fetch.mock.calls.find(([url]) =>
      /\/api\/auth\/logout$/.test(url),
    )
    expect(logoutCall).toBeDefined()
    expect(logoutCall[1].headers.Authorization).toBe('Bearer live-token')
  })

  it('loads subscription status after authentication and clears it on logout', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(tokenResponse({ accessToken: 'tok' }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 's1', status: 'ACTIVE' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }))

    function SubProbe() {
      const auth = AuthCtxModule.useAuth()
      return (
        <span data-testid="sub">{auth.subscriptionStatus}</span>
      )
    }

    render(
      <MemoryRouter>
        <AuthCtxModule.AuthProvider>
          <Probe />
          <SubProbe />
        </AuthCtxModule.AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('sub').textContent).toBe('active'),
    )

    await act(async () => {
      screen.getByText('logout').click()
    })

    await waitFor(() =>
      expect(screen.getByTestId('sub').textContent).toBe('unknown'),
    )
  })

  it('subscription status falls back to "none" when /me errors (fail closed)', async () => {
    globalThis.fetch
      .mockResolvedValueOnce(tokenResponse())
      .mockRejectedValueOnce(new TypeError('boom'))

    function SubProbe() {
      const auth = AuthCtxModule.useAuth()
      return <span data-testid="sub">{auth.subscriptionStatus}</span>
    }

    render(
      <MemoryRouter>
        <AuthCtxModule.AuthProvider>
          <SubProbe />
        </AuthCtxModule.AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() =>
      expect(screen.getByTestId('sub').textContent).toBe('none'),
    )
  })
})

