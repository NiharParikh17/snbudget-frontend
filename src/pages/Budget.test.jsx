import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Budget from './Budget.jsx'

describe('Budget page', () => {
  it('renders a Budget heading and a coming-soon stub', () => {
    render(<Budget />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^budget$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

