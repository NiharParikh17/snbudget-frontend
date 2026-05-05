import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ErrorBanner from './ErrorBanner.jsx'

describe('ErrorBanner', () => {
  it('renders the message with role="alert"', () => {
    render(<ErrorBanner>Something broke</ErrorBanner>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Something broke')
  })

  it('omits the retry button when no onRetry is provided', () => {
    render(<ErrorBanner>Oops</ErrorBanner>)
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull()
  })

  it('shows a Try again button that fires onRetry when provided', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<ErrorBanner onRetry={onRetry}>Oops</ErrorBanner>)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})

