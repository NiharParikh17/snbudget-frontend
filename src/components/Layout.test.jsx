import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout.jsx'

describe('Layout', () => {
  it('renders header, footer, and the page children', () => {
    render(
      <MemoryRouter>
        <Layout>
          <p>page content</p>
        </Layout>
      </MemoryRouter>,
    )

    expect(screen.getByRole('banner')).toBeInTheDocument() // <header>
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // <footer>
    expect(screen.getByText(/page content/i)).toBeInTheDocument()
  })
})


