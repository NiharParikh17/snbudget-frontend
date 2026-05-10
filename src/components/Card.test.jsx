import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card from './Card.jsx'

describe('Card', () => {
  it('renders children inside a section with the shared surface classes', () => {
    render(
      <Card>
        <p>Hello</p>
      </Card>,
    )
    const section = screen.getByText('Hello').closest('section')
    expect(section).not.toBeNull()
    expect(section.className).toMatch(/rounded-2xl/)
    expect(section.className).toMatch(/border/)
    expect(section.className).toMatch(/shadow-sm/)
  })

  it('appends a custom className', () => {
    render(
      <Card className="extra-class">
        <p>Hi</p>
      </Card>,
    )
    const section = screen.getByText('Hi').closest('section')
    expect(section.className).toMatch(/extra-class/)
  })
})

