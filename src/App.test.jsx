import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.jsx'

describe('App', () => {
  it('renders the SNBudget brand heading', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { level: 1, name: /snbudget/i }),
    ).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<App />)
    expect(screen.getByText(/budget smarter\. split easier\./i)).toBeInTheDocument()
  })

  it('increments click counter when the button is pressed', async () => {
    const user = userEvent.setup()
    render(<App />)
    const button = screen.getByRole('button', { name: /clicks:/i })
    expect(button).toHaveTextContent('Clicks: 0')
    await user.click(button)
    await user.click(button)
    expect(button).toHaveTextContent('Clicks: 2')
  })
})

