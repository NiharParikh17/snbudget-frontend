import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home.jsx'

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  )
}

describe('Home page', () => {
  it('renders the marketing headline and tagline', () => {
    renderHome()
    expect(
      screen.getByRole('heading', { level: 1, name: /budget smarter\..*split easier\./i }),
    ).toBeInTheDocument()
  })

  it('shows primary and secondary calls-to-action linking to auth routes', () => {
    renderHome()
    expect(
      screen.getByRole('link', { name: /get started/i }),
    ).toHaveAttribute('href', '/signup')
    expect(
      screen.getByRole('link', { name: /sign in/i }),
    ).toHaveAttribute('href', '/signin')
  })

  it('lists the three feature cards', () => {
    renderHome()
    const features = screen.getByRole('region', { name: /features/i })
    expect(features).toBeInTheDocument()
    const cards = features.querySelectorAll('article')
    expect(cards).toHaveLength(3)
  })
})
