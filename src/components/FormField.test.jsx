import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FormField from './FormField.jsx'

describe('FormField', () => {
  it('associates the label with the input', () => {
    render(<FormField label="Email" name="email" value="" onChange={() => {}} />)
    const input = screen.getByLabelText(/email/i)
    expect(input).toBeInstanceOf(HTMLInputElement)
  })

  it('renders an error message and marks the input invalid', () => {
    render(
      <FormField
        label="Password"
        name="password"
        value=""
        onChange={() => {}}
        error="Required"
      />,
    )
    const input = screen.getByLabelText(/password/i)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Required')).toBeInTheDocument()
  })

  it('renders helpText when no error is present', () => {
    render(
      <FormField
        label="Password"
        name="password"
        value=""
        onChange={() => {}}
        helpText="At least 8 characters."
      />,
    )
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
  })
})

