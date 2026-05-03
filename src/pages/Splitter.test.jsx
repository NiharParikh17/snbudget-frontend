import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Splitter from './Splitter.jsx'

describe('Splitter page', () => {
  it('renders a Splitter heading and a coming-soon stub', () => {
    render(<Splitter />)
    expect(
      screen.getByRole('heading', { level: 1, name: /^splitter$/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
  })
})

