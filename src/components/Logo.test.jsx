import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Logo from './Logo.jsx'

describe('Logo', () => {
  it('renders the SNBudget wordmark by default', () => {
    render(<Logo />)
    expect(screen.getByText('SNBudget')).toBeInTheDocument()
  })

  it('hides the wordmark when iconOnly is true', () => {
    render(<Logo iconOnly />)
    expect(screen.queryByText('SNBudget')).not.toBeInTheDocument()
  })

  it('forwards extra className to the root element', () => {
    const { container } = render(<Logo className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
