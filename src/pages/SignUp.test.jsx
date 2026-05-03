import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignUp from './SignUp.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

async function fillValidForm(user) {
  await user.type(await screen.findByLabelText(/first name/i), 'Jane')
  await user.type(screen.getByLabelText(/last name/i), 'Doe')
  await user.type(screen.getByLabelText(/^email/i), 'jane@example.com')
  await user.type(screen.getByLabelText(/username/i), 'jane_doe')
  await user.type(screen.getByLabelText(/^password/i), 'hunter222')
  await user.click(screen.getByRole('checkbox'))
}

describe('SignUp page', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('no session'))
  })

  it('shows validation errors on empty submit', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUp />)
    await user.click(await screen.findByRole('button', { name: /create account/i }))

    expect(await screen.findByText(/first name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/username is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(
      screen.getByText(/you must confirm you are at least 16/i),
    ).toBeInTheDocument()
  })

  it('rejects passwords shorter than 8 characters', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUp />)
    await user.type(await screen.findByLabelText(/^password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
  })

  it('rejects malformed email addresses', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SignUp />)
    await user.type(await screen.findByLabelText(/^email/i), 'not-an-email')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument()
  })

  it('on success, posts the user payload and navigates to /signin?registered=1', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('no session'))
      .mockResolvedValueOnce(
        jsonResponse({ id: 'new-user', email: 'jane@example.com' }),
      )

    const user = userEvent.setup()
    renderWithProviders(<SignUp />)
    await fillValidForm(user)
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    await waitFor(() => {
      const createCall = globalThis.fetch.mock.calls.find((c) => c[0].endsWith('/api/identity/users'))
      expect(createCall).toBeDefined()
      const body = JSON.parse(createCall[1].body)
      expect(body).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        username: 'jane_doe',
        password: 'hunter222',
      })
      expect(body.phone).toBeUndefined()
      expect(body.profilePictureUrl).toBeUndefined()
    })
  })

  it('renders server-side fieldErrors next to the matching input', async () => {
    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('no session'))
      .mockResolvedValueOnce(
        jsonResponse(
          { message: 'Validation failed', fieldErrors: { email: 'Email already in use' } },
          { status: 400 },
        ),
      )

    const user = userEvent.setup()
    renderWithProviders(<SignUp />)
    await fillValidForm(user)
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /create account/i }))
    })

    expect(await screen.findByText(/email already in use/i)).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/validation failed/i)
  })
})



