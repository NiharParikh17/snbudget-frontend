import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import Header from './Header.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

describe('Header', () => {
  it('shows the SNBudget brand logo link', () => {
    renderWithProviders(<Header />)
    expect(screen.getByRole('link', { name: /snbudget home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('renders the SNBudget wordmark inside the brand link', () => {
    renderWithProviders(<Header />)
    const brandLink = screen.getByRole('link', { name: /snbudget home/i })
    expect(within(brandLink).getByText('SNBudget')).toBeInTheDocument()
  })

  it('exposes Sign in and Sign up actions when anonymous', async () => {
    renderWithProviders(<Header />)
    const nav = screen.getByRole('navigation', { name: /account/i })
    expect(await within(nav).findByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/signin',
    )
    expect(within(nav).getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/signup',
    )
  })
})
