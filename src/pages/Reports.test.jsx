import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Reports from './Reports.jsx'

describe('Reports page', () => {
  it('renders a Reports heading and a coming-soon stub', () => {
    render(<Reports />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^reports$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

