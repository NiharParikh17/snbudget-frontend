import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header.jsx'

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  )
}

describe('Header', () => {
  it('shows the SNBudget brand logo link', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /snbudget home/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('renders the SNBudget wordmark inside the brand link', () => {
    renderHeader()
    const brandLink = screen.getByRole('link', { name: /snbudget home/i })
    expect(within(brandLink).getByText('SNBudget')).toBeInTheDocument()
  })

  it('exposes Sign in and Sign up actions in the account nav', () => {
    renderHeader()
    const nav = screen.getByRole('navigation', { name: /account/i })
    expect(within(nav).getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/signin',
    )
    expect(within(nav).getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/signup',
    )
  })
})
