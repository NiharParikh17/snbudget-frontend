import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Settings from './Settings.jsx'
import * as AuthCtx from '../context/AuthContext.jsx'
import * as subscriptionsApi from '../api/subscriptions.js'
import * as settingsApi from '../api/settings.js'

function mockAuth(overrides = {}) {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    accessToken: 'tok',
    subscriptionStatus: 'active',
    refreshSubscription: vi.fn().mockResolvedValue(),
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route path="/choose-plan" element={<h1>Choose plan</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

const PRO_MONTHLY = {
  id: 'p-month',
  name: 'Pro Monthly',
  description: 'Full access, billed monthly.',
  billingCycle: 'MONTHLY',
  price: 9.99,
  status: 'ACTIVE',
}

const PRO_YEARLY = {
  id: 'p-year',
  name: 'Pro Yearly',
  description: 'Full access, billed yearly.',
  billingCycle: 'YEARLY',
  price: 99,
  status: 'ACTIVE',
}

const ACTIVE_SUB = {
  id: 's1',
  product: PRO_MONTHLY,
  status: 'ACTIVE',
  autoRenew: true,
  startedAt: '2026-01-15T00:00:00Z',
  expiresAt: '2026-06-15T00:00:00Z',
  cancelledAt: null,
  createdAt: '2026-01-15T00:00:00Z',
}

const HISTORY_SUBSCRIBED_ONLY = [
  {
    id: 'e1',
    subscriptionId: 's1',
    eventType: 'SUBSCRIBED',
    metadata: 'Initial signup',
    createdAt: '2026-01-15T00:00:00Z',
  },
]

function stubAllOk({
  sub = ACTIVE_SUB,
  history = HISTORY_SUBSCRIBED_ONLY,
  settings = { settings: [] },
} = {}) {
  vi.spyOn(subscriptionsApi, 'getCurrentSubscription').mockResolvedValue(sub)
  vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue(
    history,
  )
  vi.spyOn(settingsApi, 'getSettings').mockResolvedValue(settings)
}

describe('Settings', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('loads subscription, history and settings in parallel and renders the plan card', async () => {
    stubAllOk()
    renderPage()
    expect(screen.getByTestId('subscription-skeleton')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 2, name: /^subscription$/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Pro Monthly')).toBeInTheDocument()
    expect(screen.getByText(/\$9\.99 \/ month/i)).toBeInTheDocument()
    // Status badge
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
    // No preferences yet
    expect(
      await screen.findByText(/no preferences yet/i),
    ).toBeInTheDocument()
  })

  it('renders an empty-state when there is no active subscription', async () => {
    stubAllOk({ sub: null })
    renderPage()
    expect(
      await screen.findByText(/don't have an active subscription/i),
    ).toBeInTheDocument()
  })

  it('shows a retry button if the subscription fetch fails', async () => {
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(ACTIVE_SUB)
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue(
      HISTORY_SUBSCRIBED_ONLY,
    )
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    renderPage()
    expect(
      await screen.findByText(/could not load your subscription/i),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findByText('Pro Monthly')).toBeInTheDocument()
  })

  it('shows a settings error with a retry button without breaking subscription rendering', async () => {
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription').mockResolvedValue(
      ACTIVE_SUB,
    )
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue(
      HISTORY_SUBSCRIBED_ONLY,
    )
    vi.spyOn(settingsApi, 'getSettings')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ settings: [] })
    renderPage()
    expect(await screen.findByText('Pro Monthly')).toBeInTheDocument()
    expect(
      await screen.findByText(/could not load your preferences/i),
    ).toBeInTheDocument()
    const retryButtons = await screen.findAllByRole('button', {
      name: /try again/i,
    })
    fireEvent.click(retryButtons[retryButtons.length - 1])
    await waitFor(() =>
      expect(screen.getByText(/no preferences yet/i)).toBeInTheDocument(),
    )
  })

  it('drops backend settings keys not in the frontend allow-list', async () => {
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription').mockResolvedValue(
      ACTIVE_SUB,
    )
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue([])
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      settings: [
        { key: 'THEME', value: 'DARK' },
        { key: 'BUDGET_ALERT_THRESHOLD_PERCENTAGE', value: '80' },
      ],
    })
    renderPage()
    // Allow-list is empty, so the empty-state is rendered.
    expect(
      await screen.findByText(/no preferences yet/i),
    ).toBeInTheDocument()
  })

  it('toggles auto-renew optimistically and rolls back on error', async () => {
    stubAllOk()
    const updateSpy = vi
      .spyOn(subscriptionsApi, 'updateAutoRenew')
      .mockRejectedValue(new Error('boom'))
    renderPage()
    const toggle = await screen.findByRole('switch', { name: /auto-renew/i })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    await waitFor(() => expect(updateSpy).toHaveBeenCalled())
    // Rolled back to checked after the failure.
    await waitFor(() => expect(toggle).toBeChecked())
    expect(
      await screen.findByText(/could not update auto-renew/i),
    ).toBeInTheDocument()
  })

  it('hides the auto-renew toggle for LIFETIME subscriptions', async () => {
    stubAllOk({
      sub: {
        ...ACTIVE_SUB,
        product: { ...PRO_MONTHLY, billingCycle: 'LIFETIME' },
        autoRenew: false,
        expiresAt: null,
      },
    })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(screen.queryByRole('switch', { name: /auto-renew/i })).toBeNull()
  })

  it('opens the change-plan panel, schedules a change, and refreshes history', async () => {
    stubAllOk()
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      PRO_MONTHLY,
      PRO_YEARLY,
    ])
    const changeSpy = vi
      .spyOn(subscriptionsApi, 'requestProductChange')
      .mockResolvedValue({ id: 'c1', status: 'PENDING' })
    // Second history fetch (after scheduling) returns the new event.
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory')
      .mockResolvedValueOnce(HISTORY_SUBSCRIBED_ONLY)
      .mockResolvedValueOnce([
        {
          id: 'e2',
          subscriptionId: 's1',
          eventType: 'CHANGE_SCHEDULED',
          metadata: 'Pro Monthly → Pro Yearly',
          createdAt: '2026-05-02T00:00:00Z',
        },
        ...HISTORY_SUBSCRIBED_ONLY,
      ])

    renderPage()
    await screen.findByText('Pro Monthly')
    await userEvent.click(
      screen.getByRole('button', { name: /change plan/i }),
    )
    // Yearly is the only "other" product → preselected.
    expect(
      await screen.findByRole('radio', { name: /pro yearly/i }),
    ).toBeChecked()
    await userEvent.click(
      screen.getByRole('button', { name: /schedule change/i }),
    )
    await waitFor(() =>
      expect(changeSpy).toHaveBeenCalledWith('tok', {
        targetProductId: 'p-year',
        effectiveType: 'NEXT_BILLING_CYCLE',
      }),
    )
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /plan change scheduled/i,
      }),
    ).toBeInTheDocument()
  })

  it('detects an existing pending scheduled change from history', async () => {
    stubAllOk({
      history: [
        {
          id: 'e2',
          subscriptionId: 's1',
          eventType: 'CHANGE_SCHEDULED',
          metadata: 'Pro Monthly → Pro Yearly',
          createdAt: '2026-05-02T00:00:00Z',
        },
        ...HISTORY_SUBSCRIBED_ONLY,
      ],
    })
    renderPage()
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: /plan change scheduled/i,
      }),
    ).toBeInTheDocument()
  })

  it('does not show the pending banner when CHANGE_CANCELLED supersedes the schedule', async () => {
    stubAllOk({
      history: [
        {
          id: 'e3',
          subscriptionId: 's1',
          eventType: 'CHANGE_CANCELLED',
          createdAt: '2026-05-03T00:00:00Z',
        },
        {
          id: 'e2',
          subscriptionId: 's1',
          eventType: 'CHANGE_SCHEDULED',
          createdAt: '2026-05-02T00:00:00Z',
        },
        ...HISTORY_SUBSCRIBED_ONLY,
      ],
    })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(
      screen.queryByRole('heading', { name: /plan change scheduled/i }),
    ).toBeNull()
  })

  it('cancels the scheduled change when the user clicks the button', async () => {
    const pendingHistory = [
      {
        id: 'e2',
        subscriptionId: 's1',
        eventType: 'CHANGE_SCHEDULED',
        createdAt: '2026-05-02T00:00:00Z',
      },
      ...HISTORY_SUBSCRIBED_ONLY,
    ]
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription').mockResolvedValue(
      ACTIVE_SUB,
    )
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    // First fetch (mount) → pending; second fetch (after cancel) → cancelled.
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory')
      .mockResolvedValueOnce(pendingHistory)
      .mockResolvedValueOnce([
        {
          id: 'e3',
          subscriptionId: 's1',
          eventType: 'CHANGE_CANCELLED',
          createdAt: '2026-05-03T00:00:00Z',
        },
        ...pendingHistory,
      ])
    const cancelSpy = vi
      .spyOn(subscriptionsApi, 'cancelScheduledChange')
      .mockResolvedValue()
    renderPage()
    const cancelBtn = await screen.findByRole('button', {
      name: /cancel scheduled change/i,
    })
    await userEvent.click(cancelBtn)
    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('tok'))
  })

  it('cancels the subscription via a two-step confirm and re-renders the cancelled state', async () => {
    const refreshSubscription = vi.fn().mockResolvedValue()
    mockAuth({ refreshSubscription })
    const cancelledSub = {
      ...ACTIVE_SUB,
      status: 'CANCELLED',
      cancelledAt: '2026-05-02T00:00:00Z',
    }
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription')
      .mockResolvedValueOnce(ACTIVE_SUB)
      .mockResolvedValueOnce(cancelledSub)
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue(
      HISTORY_SUBSCRIBED_ONLY,
    )
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    const cancelSpy = vi
      .spyOn(subscriptionsApi, 'cancelSubscription')
      .mockResolvedValue()

    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^cancel subscription$/i }),
    )
    expect(
      screen.getByRole('heading', { name: /cancel your subscription\?/i }),
    ).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /yes, cancel subscription/i }),
    )
    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('tok'))
    await waitFor(() => expect(refreshSubscription).toHaveBeenCalled())
    expect(
      await screen.findByText(/your subscription is cancelled/i),
    ).toBeInTheDocument()
  })

  it('navigates to /choose-plan if the subscription is gone after cancel', async () => {
    const refreshSubscription = vi.fn().mockResolvedValue()
    mockAuth({ refreshSubscription })
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription')
      .mockResolvedValueOnce(ACTIVE_SUB)
      .mockResolvedValueOnce(null)
    vi.spyOn(subscriptionsApi, 'getSubscriptionHistory').mockResolvedValue([])
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    vi.spyOn(subscriptionsApi, 'cancelSubscription').mockResolvedValue()
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^cancel subscription$/i }),
    )
    await userEvent.click(
      screen.getByRole('button', { name: /yes, cancel subscription/i }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /choose plan/i }),
    ).toBeInTheDocument()
  })

  it('renders activity events from the history endpoint', async () => {
    stubAllOk({
      history: [
        {
          id: 'e2',
          subscriptionId: 's1',
          eventType: 'AUTO_RENEWED',
          createdAt: '2026-04-15T12:00:00Z',
        },
        ...HISTORY_SUBSCRIBED_ONLY,
      ],
    })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(screen.getByText(/auto-renewed/i)).toBeInTheDocument()
    expect(screen.getByText(/^subscribed$/i)).toBeInTheDocument()
  })
})



