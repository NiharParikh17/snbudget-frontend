import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Welcome from './Welcome.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

describe('Welcome page', () => {
  it('renders the success heading and a sign-out button', async () => {
    renderWithProviders(<Welcome />)
    expect(
      await screen.findByRole('heading', { level: 1, name: /you're in/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})

