import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ChoosePlan from './ChoosePlan.jsx'
import * as AuthCtx from '../context/AuthContext.jsx'
import * as subscriptionsApi from '../api/subscriptions.js'

function mockAuth(overrides = {}) {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    accessToken: 'tok',
    subscriptionStatus: 'none',
    logout: vi.fn().mockResolvedValue(),
    refreshSubscription: vi.fn().mockResolvedValue(),
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/choose-plan']}>
      <Routes>
        <Route path="/choose-plan" element={<ChoosePlan />} />
        <Route path="/app/dashboard" element={<h1>Dashboard</h1>} />
        <Route path="/" element={<h1>Home</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const PRODUCTS = [
  {
    id: 'p-month',
    name: 'Pro Monthly',
    description: 'Full access, billed monthly.',
    billingCycle: 'MONTHLY',
    price: 9.99,
    status: 'ACTIVE',
  },
  {
    id: 'p-year',
    name: 'Pro Yearly',
    description: 'Same Pro, save vs monthly.',
    billingCycle: 'YEARLY',
    price: 99,
    status: 'ACTIVE',
  },
  {
    id: 'p-life',
    name: 'Lifetime',
    description: 'Pay once, use forever.',
    billingCycle: 'LIFETIME',
    price: 199,
    status: 'ACTIVE',
  },
]

describe('ChoosePlan', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('shows loading skeletons, then renders product cards', async () => {
    let resolve
    vi.spyOn(subscriptionsApi, 'listProducts').mockReturnValue(
      new Promise((r) => {
        resolve = r
      }),
    )
    renderPage()
    expect(screen.getAllByTestId('plan-skeleton').length).toBeGreaterThan(0)
    resolve(PRODUCTS)
    await waitFor(() =>
      expect(screen.getByText('Pro Monthly')).toBeInTheDocument(),
    )
    expect(screen.getByText('Pro Yearly')).toBeInTheDocument()
    expect(screen.getByText('Lifetime')).toBeInTheDocument()
  })

  it('preselects the first plan and reflects selection via aria-checked', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    renderPage()
    await waitFor(() => screen.getByText('Pro Monthly'))
    await waitFor(() => {
      const radios = screen.getAllByRole('radio')
      expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    })
    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('lets the user pick another plan with a click', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    renderPage()
    await waitFor(() => screen.getByText('Pro Monthly'))
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
  })

  it('shows a "Best value" badge on yearly when it beats 12× monthly', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    renderPage()
    await waitFor(() => screen.getByText('Pro Yearly'))
    expect(screen.getByText(/best value/i)).toBeInTheDocument()
  })

  it('does not show "Best value" when yearly is not cheaper than 12× monthly', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      { ...PRODUCTS[0], price: 5 },
      { ...PRODUCTS[1], price: 120 }, // 5 * 12 = 60, 120 > 60
    ])
    renderPage()
    await waitFor(() => screen.getByText('Pro Yearly'))
    expect(screen.queryByText(/best value/i)).toBeNull()
  })

  it('renders an enabled Continue button with helper text', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    renderPage()
    await waitFor(() => screen.getByText('Pro Monthly'))
    const cont = screen.getByRole('button', { name: /^continue$/i })
    expect(cont).toBeEnabled()
    expect(
      screen.getByText(/no payment required yet/i),
    ).toBeInTheDocument()
  })

  it('subscribes to the selected plan, refreshes status, and navigates to /app/dashboard', async () => {
    const refreshSubscription = vi.fn().mockResolvedValue()
    mockAuth({ refreshSubscription })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    const subSpy = vi
      .spyOn(subscriptionsApi, 'subscribe')
      .mockResolvedValue({ id: 's1', status: 'ACTIVE' })
    renderPage()
    await waitFor(() => screen.getByText('Pro Monthly'))
    // Pick the yearly card
    const radios = screen.getAllByRole('radio')
    fireEvent.click(radios[1])
    await userEvent.click(screen.getByRole('button', { name: /^continue$/i }))
    await waitFor(() =>
      expect(subSpy).toHaveBeenCalledWith('tok', {
        productId: 'p-year',
        autoRenew: true,
      }),
    )
    await waitFor(() => expect(refreshSubscription).toHaveBeenCalled())
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: /^dashboard$/i }),
      ).toBeInTheDocument(),
    )
  })

  it('shows an error and re-enables Continue if subscribe fails', async () => {
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    vi.spyOn(subscriptionsApi, 'subscribe').mockRejectedValue(
      new Error('nope'),
    )
    renderPage()
    await waitFor(() => screen.getByText('Pro Monthly'))
    const cont = screen.getByRole('button', { name: /^continue$/i })
    await userEvent.click(cont)
    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/could not start your subscription/i)
    expect(
      screen.getByRole('button', { name: /^continue$/i }),
    ).toBeEnabled()
  })

  it('shows an error state with a retry button', async () => {
    const spy = vi
      .spyOn(subscriptionsApi, 'listProducts')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(PRODUCTS)
    renderPage()
    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/could not load subscription plans/i)
    const retry = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(retry)
    await waitFor(() => screen.getByText('Pro Monthly'))
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('shows an empty state with a sign-out button when no plans exist', async () => {
    const logout = vi.fn().mockResolvedValue()
    mockAuth({ logout })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([])
    renderPage()
    expect(
      await screen.findByRole('heading', { name: /no plans are available/i }),
    ).toBeInTheDocument()
    const out = screen.getByRole('button', { name: /sign out/i })
    await userEvent.click(out)
    expect(logout).toHaveBeenCalled()
  })

  it('redirects active subscribers to /app/dashboard', async () => {
    mockAuth({ subscriptionStatus: 'active' })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue(PRODUCTS)
    renderPage()
    expect(
      await screen.findByRole('heading', { level: 1, name: /^dashboard$/i }),
    ).toBeInTheDocument()
  })
})


