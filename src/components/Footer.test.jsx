import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Footer from './Footer.jsx'

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  )
}

describe('Footer', () => {
  it('renders a copyright with the current year', () => {
    renderFooter()
    const year = new Date().getFullYear()
    expect(
      screen.getByText(new RegExp(`©\\s*${year}\\s*SNBudget`, 'i')),
    ).toBeInTheDocument()
  })

  it('renders About / Privacy / Terms in the footer nav', () => {
    renderFooter()
    const nav = screen.getByRole('navigation', { name: /footer/i })
    expect(within(nav).getByRole('link', { name: /about/i })).toHaveAttribute(
      'href',
      '/about',
    )
    expect(within(nav).getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy',
    )
    expect(within(nav).getByRole('link', { name: /terms/i })).toHaveAttribute(
      'href',
      '/terms',
    )
  })
})


