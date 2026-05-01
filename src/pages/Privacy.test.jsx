import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Privacy from './Privacy.jsx'

function renderPrivacy() {
  return render(
    <MemoryRouter>
      <Privacy />
    </MemoryRouter>,
  )
}

describe('Privacy page', () => {
  it('renders the page heading', () => {
    renderPrivacy()
    expect(
      screen.getByRole('heading', { level: 1, name: /your money\. your data\./i }),
    ).toBeInTheDocument()
  })

  it('shows a "Last updated" stamp', () => {
    renderPrivacy()
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument()
  })

  it('lists the privacy principles', () => {
    renderPrivacy()
    expect(
      screen.getByRole('heading', { level: 3, name: /data minimization/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: /no selling, no ad targeting/i }),
    ).toBeInTheDocument()
  })

  it('explains what is and is not collected', () => {
    renderPrivacy()
    expect(
      screen.getByRole('heading', { level: 2, name: /what we collect today/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /what we do .*not.* collect/i }),
    ).toBeInTheDocument()
  })

  it('links to Terms and back home', () => {
    renderPrivacy()
    expect(
      screen.getByRole('link', { name: /read the terms/i }),
    ).toHaveAttribute('href', '/terms')
    expect(
      screen.getByRole('link', { name: /back to home/i }),
    ).toHaveAttribute('href', '/')
  })
})

