import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Transactions from './Transactions.jsx'

describe('Transactions page', () => {
  it('renders a Transactions heading and a coming-soon stub', () => {
    render(<Transactions />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^transactions$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

