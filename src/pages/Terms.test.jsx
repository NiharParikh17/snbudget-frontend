import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Terms from './Terms.jsx'

function renderTerms() {
  return render(
    <MemoryRouter>
      <Terms />
    </MemoryRouter>,
  )
}

describe('Terms page', () => {
  it('renders the page heading', () => {
    renderTerms()
    expect(
      screen.getByRole('heading', { level: 1, name: /terms of use/i }),
    ).toBeInTheDocument()
  })

  it('shows a "Last updated" stamp', () => {
    renderTerms()
    expect(screen.getByText(/last updated:/i)).toBeInTheDocument()
  })

  it('clarifies SNBudget is not a payment processor / does not move money', () => {
    renderTerms()
    expect(
      screen.getByRole('heading', { level: 2, name: /splits between users/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/does not move money/i)).toBeInTheDocument()
  })

  it('contains acceptable-use, disclaimers, and liability sections', () => {
    renderTerms()
    expect(
      screen.getByRole('heading', { level: 2, name: /acceptable use/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /disclaimers/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2, name: /limitation of liability/i }),
    ).toBeInTheDocument()
  })

  it('links to Privacy and back home', () => {
    renderTerms()
    expect(
      screen.getByRole('link', { name: /read the privacy notes/i }),
    ).toHaveAttribute('href', '/privacy')
    expect(
      screen.getByRole('link', { name: /back to home/i }),
    ).toHaveAttribute('href', '/')
  })
})

