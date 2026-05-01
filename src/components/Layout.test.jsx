import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import Layout from './Layout.jsx'
import { renderWithProviders } from '../test/renderWithProviders.jsx'

describe('Layout', () => {
  it('renders header, footer, and the page children', () => {
    renderWithProviders(
      <Layout>
        <p>page content</p>
      </Layout>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument() // <header>
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // <footer>
    expect(screen.getByText(/page content/i)).toBeInTheDocument()
  })
})
