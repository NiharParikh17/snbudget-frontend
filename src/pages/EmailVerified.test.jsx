import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, screen } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import EmailVerified from './EmailVerified.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

function renderAt(route) {
  return renderWithProviders(
    <Routes>
      <Route path="/email-verified" element={<EmailVerified />} />
      <Route path="/signin" element={<div>Sign in page</div>} />
    </Routes>,
    { route },
  )
}

describe('EmailVerified page', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('no session'))
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('success state (?status=success)', () => {
    it('renders the success copy and a CTA linking to /signin', async () => {
      renderAt('/email-verified?status=success')
      expect(
        await screen.findByRole('heading', { name: /email verified!/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/your email address has been confirmed/i),
      ).toBeInTheDocument()
      const cta = screen.getByRole('link', { name: /go to sign in now/i })
      expect(cta).toHaveAttribute('href', '/signin')
    })

    it('shows a live countdown that decrements each second', async () => {
      renderAt('/email-verified?status=success')
      const status = await screen.findByRole('status')
      expect(status).toHaveTextContent(/redirecting you to sign in in 10 seconds/i)

      await act(async () => {
        vi.advanceTimersByTime(1000)
      })
      expect(status).toHaveTextContent(/in 9 seconds/i)

      await act(async () => {
        vi.advanceTimersByTime(8000)
      })
      expect(status).toHaveTextContent(/in 1 second/i)
      // singular form, not "1 seconds"
      expect(status.textContent).not.toMatch(/1 seconds/i)
    })

    it('navigates to /signin after 10 seconds', async () => {
      renderAt('/email-verified?status=success')
      await screen.findByRole('heading', { name: /email verified!/i })

      await act(async () => {
        vi.advanceTimersByTime(10_000)
      })

      expect(await screen.findByText(/sign in page/i)).toBeInTheDocument()
    })

    it('clears the interval on unmount (no late navigation)', async () => {
      const { unmount } = renderAt('/email-verified?status=success')
      await screen.findByRole('heading', { name: /email verified!/i })
      unmount()

      await act(async () => {
        vi.advanceTimersByTime(30_000)
      })
      expect(screen.queryByText(/sign in page/i)).not.toBeInTheDocument()
    })
  })

  describe('invalid state', () => {
    it('renders the invalid copy + red alert when ?status=invalid', async () => {
      renderAt('/email-verified?status=invalid')
      expect(
        await screen.findByRole('heading', { name: /link is no longer valid/i }),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/this verification link has expired or has already been used/i),
      ).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /go to sign in/i })).toHaveAttribute(
        'href',
        '/signin',
      )
    })

    it('treats a missing status param as invalid', async () => {
      renderAt('/email-verified')
      expect(
        await screen.findByRole('heading', { name: /link is no longer valid/i }),
      ).toBeInTheDocument()
    })

    it('treats an unknown status value as invalid', async () => {
      renderAt('/email-verified?status=banana')
      expect(
        await screen.findByRole('heading', { name: /link is no longer valid/i }),
      ).toBeInTheDocument()
    })

    it('does NOT auto-redirect from the invalid state', async () => {
      renderAt('/email-verified?status=invalid')
      await screen.findByRole('heading', { name: /link is no longer valid/i })

      await act(async () => {
        vi.advanceTimersByTime(15_000)
      })

      expect(screen.queryByText(/sign in page/i)).not.toBeInTheDocument()
      expect(
        screen.getByRole('heading', { name: /link is no longer valid/i }),
      ).toBeInTheDocument()
    })

    it('never raw-renders the status query value', async () => {
      renderAt('/email-verified?status=banana')
      await screen.findByRole('heading', { name: /link is no longer valid/i })
      expect(screen.queryByText(/banana/i)).not.toBeInTheDocument()
    })
  })
})

