import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import AuthFormShell from './AuthFormShell.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

describe('AuthFormShell', () => {
  it('renders the brand link, title, subtitle, and footer slot', () => {
    renderWithProviders(
      <AuthFormShell
        title="Test title"
        subtitle="Test subtitle"
        footer={<a href="/elsewhere">elsewhere</a>}
      >
        <p>form goes here</p>
      </AuthFormShell>,
    )
    expect(screen.getByRole('link', { name: /snbudget home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('heading', { level: 1, name: /test title/i })).toBeInTheDocument()
    expect(screen.getByText(/test subtitle/i)).toBeInTheDocument()
    expect(screen.getByText(/form goes here/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /elsewhere/i })).toBeInTheDocument()
  })
})

