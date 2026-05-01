import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App.jsx'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('renders the layout chrome (header + footer) on every route', () => {
    renderAt('/')
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders the Home page hero at "/"', () => {
    renderAt('/')
    expect(
      screen.getByRole('heading', { level: 1, name: /budget smarter/i }),
    ).toBeInTheDocument()
  })

  it('renders the About page at "/about"', () => {
    renderAt('/about')
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /one app for your budget and your splits/i,
      }),
    ).toBeInTheDocument()
  })

  it('renders the Privacy page at "/privacy"', () => {
    renderAt('/privacy')
    expect(
      screen.getByRole('heading', { level: 1, name: /your money\. your data\./i }),
    ).toBeInTheDocument()
  })

  it('renders the Terms page at "/terms"', () => {
    renderAt('/terms')
    expect(
      screen.getByRole('heading', { level: 1, name: /terms of use/i }),
    ).toBeInTheDocument()
  })

  it('redirects unknown routes to Home', () => {
    renderAt('/does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: /budget smarter/i }),
    ).toBeInTheDocument()
  })
})

