import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from './Dashboard.jsx'

describe('Dashboard page', () => {
  it('renders a Dashboard heading and a coming-soon stub', () => {
    render(<Dashboard />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^dashboard$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

