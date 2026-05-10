import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import { PRIMARY_TABS } from './primaryTabs.js'

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar mobile />
    </MemoryRouter>,
  )
}

describe('Sidebar', () => {
  it('exposes the five primary tabs as nav links with the right hrefs', () => {
    renderAt('/app/dashboard')
    const nav = screen.getByRole('navigation', { name: /primary/i })
    expect(nav).toBeInTheDocument()

    expect(PRIMARY_TABS).toHaveLength(5)
    for (const { to, label } of PRIMARY_TABS) {
      const link = screen.getByRole('link', { name: new RegExp(`^${label}$`, 'i') })
      expect(link).toHaveAttribute('href', to)
    }
  })

  it('renders an svg icon for each tab', () => {
    const { container } = renderAt('/app/dashboard')
    expect(container.querySelectorAll('nav a svg')).toHaveLength(PRIMARY_TABS.length)
  })

  it('marks the active tab with the violet active class', () => {
    renderAt('/app/transactions')
    const active = screen.getByRole('link', { name: /^transactions$/i })
    expect(active.className).toMatch(/violet/)

    const inactive = screen.getByRole('link', { name: /^dashboard$/i })
    expect(inactive.className).not.toMatch(/bg-violet/)
  })

  it('invokes onNavigate when a link is clicked (mobile drawer close)', async () => {
    const onNavigate = vi.fn()
    render(
      <MemoryRouter initialEntries={['/app/dashboard']}>
        <Sidebar mobile onNavigate={onNavigate} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getByRole('link', { name: /^reports$/i }))
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })
})


