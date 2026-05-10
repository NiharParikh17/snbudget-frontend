import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignIn from './SignIn.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('SignIn page', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('no session'))
  })

  it('renders identifier + password fields and a submit button', async () => {
    renderWithProviders(<SignIn />)
    expect(await screen.findByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows the verification banner when ?registered=1', async () => {
    renderWithProviders(<SignIn />, { route: '/signin?registered=1' })
    expect(
      await screen.findByText(/check your email for a verification link/i),
    ).toBeInTheDocument()
  })

  it('blocks submission and shows inline errors when fields are empty', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignIn />)
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/enter your email or username/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument()
    // No login attempt should have happened
    expect(globalThis.fetch.mock.calls.find((c) => c[0].includes('/api/identity/auth/login'))).toBeUndefined()
  })

  it('surfaces server errors verbatim (e.g. email not verified)', async () => {
    globalThis.fetch = vi
      .fn()
      // initial refresh
      .mockRejectedValueOnce(new TypeError('no session'))
      // login
      .mockResolvedValueOnce(jsonResponse({ message: 'Please verify your email first' }, { status: 401 }))

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)

    await user.type(await screen.findByLabelText(/email or username/i), 'jane@example.com')
    await user.type(screen.getByLabelText(/password/i), 'hunter22!')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /sign in/i }))
    })

    expect(await screen.findByRole('alert')).toHaveTextContent(/please verify your email first/i)
  })

  it('on success, calls login and posts the trimmed identifier', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('no session'))
      .mockResolvedValueOnce(
        jsonResponse({ accessToken: 't', tokenType: 'Bearer', expiresIn: 900, userId: 'u' }),
      )

    const user = userEvent.setup()
    renderWithProviders(<SignIn />)

    await user.type(await screen.findByLabelText(/email or username/i), '  jane@example.com  ')
    await user.type(screen.getByLabelText(/password/i), 'hunter22!')
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /sign in/i }))
    })

    await waitFor(() => {
      const loginCall = globalThis.fetch.mock.calls.find((c) => c[0].includes('/api/identity/auth/login'))
      expect(loginCall).toBeDefined()
      expect(JSON.parse(loginCall[1].body)).toEqual({
        identifier: 'jane@example.com',
        password: 'hunter22!',
      })
    })
  })
})

