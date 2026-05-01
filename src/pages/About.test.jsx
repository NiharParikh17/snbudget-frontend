import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import About from './About.jsx'

function renderAbout() {
  return render(
    <MemoryRouter>
      <About />
    </MemoryRouter>,
  )
}

describe('About page', () => {
  it('renders the page heading', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /one app for your budget and your splits/i,
      }),
    ).toBeInTheDocument()
  })

  it('explains who SNBudget is for', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { level: 2, name: /who it'?s for/i }),
    ).toBeInTheDocument()
  })

  it('lists the core feature pillars (incl. budgeting and splitting)', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { level: 3, name: /personal budgeting/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: /built-in expense splitting/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: /auto-balanced budgets/i }),
    ).toBeInTheDocument()
  })

  it('shows non-goals so scope is honest', () => {
    renderAbout()
    expect(
      screen.getByRole('heading', { level: 2, name: /deliberately won.?t do/i }),
    ).toBeInTheDocument()
  })

  it('offers a CTA to create an account and a link back home', () => {
    renderAbout()
    expect(
      screen.getByRole('link', { name: /create your account/i }),
    ).toHaveAttribute('href', '/signup')
    expect(
      screen.getByRole('link', { name: /back to home/i }),
    ).toHaveAttribute('href', '/')
  })
})


