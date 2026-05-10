import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import IconHome from './IconHome.jsx'
import IconCreditCard from './IconCreditCard.jsx'
import IconPieChart from './IconPieChart.jsx'
import IconWallet from './IconWallet.jsx'
import IconUsers from './IconUsers.jsx'

describe.each([
  ['IconHome', IconHome],
  ['IconCreditCard', IconCreditCard],
  ['IconPieChart', IconPieChart],
  ['IconWallet', IconWallet],
  ['IconUsers', IconUsers],
])('%s', (_name, Component) => {
  it('renders an aria-hidden svg', () => {
    const { container } = render(<Component />)
    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('passes className through', () => {
    const { container } = render(<Component className="h-9 w-9 text-violet-500" />)
    const svg = container.querySelector('svg')
    expect(svg.getAttribute('class')).toContain('h-9')
    expect(svg.getAttribute('class')).toContain('text-violet-500')
  })
})

