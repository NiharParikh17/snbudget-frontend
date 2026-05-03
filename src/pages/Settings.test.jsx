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
  changeable: true,
  cancellable: true,
  pendingChange: null,
}

const PENDING_CHANGE = {
  id: 'c1',
  targetProduct: PRO_YEARLY,
  effectiveType: 'NEXT_BILLING_CYCLE',
  effectiveDate: null,
  status: 'PENDING',
  createdAt: '2026-05-02T00:00:00Z',
}

function stubAllOk({ sub = ACTIVE_SUB, settings = { settings: [] } } = {}) {
  vi.spyOn(subscriptionsApi, 'getCurrentSubscription').mockResolvedValue(sub)
  vi.spyOn(settingsApi, 'getSettings').mockResolvedValue(settings)
}

describe('Settings', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('loads subscription and settings in parallel and renders the plan card', async () => {
    stubAllOk()
    renderPage()
    expect(screen.getByTestId('subscription-skeleton')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { level: 2, name: /^subscription$/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Pro Monthly')).toBeInTheDocument()
    expect(screen.getByText(/\$9\.99 \/ month/i)).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()
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
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({
      settings: [
        { key: 'THEME', value: 'DARK' },
        { key: 'BUDGET_ALERT_THRESHOLD_PERCENTAGE', value: '80' },
      ],
    })
    renderPage()
    expect(
      await screen.findByText(/no preferences yet/i),
    ).toBeInTheDocument()
  })

  it('does not render an auto-renew checkbox/switch (cancel is the only off-switch)', async () => {
    stubAllOk()
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(screen.queryByRole('switch', { name: /auto-renew/i })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: /auto-renew/i })).toBeNull()
  })

  it('labels the renewal date "Renews on" when auto-renew is on', async () => {
    stubAllOk()
    renderPage()
    expect(await screen.findByText(/^renews on$/i)).toBeInTheDocument()
  })

  it('labels the renewal date "Ends on" when auto-renew is off', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, autoRenew: false } })
    renderPage()
    expect(await screen.findByText(/^ends on$/i)).toBeInTheDocument()
  })

  it('hides Change plan when changeable=false', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, changeable: false } })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(
      screen.queryByRole('button', { name: /^change plan$/i }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: /^cancel subscription$/i }),
    ).toBeInTheDocument()
  })

  it('hides Cancel subscription when cancellable=false', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, cancellable: false } })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(
      screen.queryByRole('button', { name: /^cancel subscription$/i }),
    ).toBeNull()
    expect(
      screen.getByRole('button', { name: /^change plan$/i }),
    ).toBeInTheDocument()
  })

  it('shows an explainer when both changeable and cancellable are false', async () => {
    stubAllOk({
      sub: { ...ACTIVE_SUB, changeable: false, cancellable: false },
    })
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(
      screen.getByText(/can't be changed or cancelled/i),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^change plan$/i }),
    ).toBeNull()
    expect(
      screen.queryByRole('button', { name: /^cancel subscription$/i }),
    ).toBeNull()
  })

  it('opens the change-plan modal, schedules a change, and refreshes the subscription', async () => {
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription')
      .mockResolvedValueOnce(ACTIVE_SUB)
      .mockResolvedValueOnce({ ...ACTIVE_SUB, pendingChange: PENDING_CHANGE })
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      PRO_MONTHLY,
      PRO_YEARLY,
    ])
    const changeSpy = vi
      .spyOn(subscriptionsApi, 'requestProductChange')
      .mockResolvedValue({ id: 'c1', status: 'PENDING' })

    renderPage()
    await screen.findByText('Pro Monthly')
    await userEvent.click(
      screen.getByRole('button', { name: /^change plan$/i }),
    )
    // Plan picker opens as a portaled dialog (a11y: role=dialog,
    // aria-modal). The page itself doesn't reflow.
    const dialog = await screen.findByRole('dialog', {
      name: /change your plan/i,
    })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
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
    // After scheduling, the modal closes and the top-of-page banner shows
    // the pending change. The Change-plan button is relabeled.
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(
      await screen.findByText(/plan change scheduled/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/switching to/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^change scheduled plan$/i }),
    ).toBeInTheDocument()
  })

  it('disables Schedule change when the picked target equals the already-scheduled plan', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, pendingChange: PENDING_CHANGE } })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      PRO_MONTHLY,
      PRO_YEARLY,
    ])
    const changeSpy = vi
      .spyOn(subscriptionsApi, 'requestProductChange')
      .mockResolvedValue({ id: 'c1', status: 'PENDING' })

    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^change scheduled plan$/i }),
    )
    // Pro Yearly is the only "other" product AND the already-scheduled
    // target → it's pre-selected, so Schedule change is disabled out of
    // the gate and an explainer is rendered.
    const radio = await screen.findByRole('radio', { name: /pro yearly/i })
    expect(radio).toBeChecked()
    const scheduleBtn = screen.getByRole('button', {
      name: /^schedule change$/i,
    })
    expect(scheduleBtn).toBeDisabled()
    expect(
      screen.getByText(/this plan is already scheduled/i),
    ).toBeInTheDocument()
    // Belt-and-brace: the backend was never contacted.
    expect(changeSpy).not.toHaveBeenCalled()
  })

  it('closes the change-plan modal when the close button is clicked', async () => {
    stubAllOk()
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      PRO_MONTHLY,
      PRO_YEARLY,
    ])
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^change plan$/i }),
    )
    expect(
      await screen.findByRole('dialog', { name: /change your plan/i }),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /^close$/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('renders the pending-change banner from sub.pendingChange (no inline buttons)', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, pendingChange: PENDING_CHANGE } })
    renderPage()
    expect(
      await screen.findByText(/plan change scheduled/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/switching to/i)).toBeInTheDocument()
    expect(screen.getByText(/pro yearly/i)).toBeInTheDocument()
    // The banner itself is intentionally action-less; cancel-scheduled
    // lives inside the Change-plan tile.
    expect(
      screen.queryByRole('button', { name: /cancel scheduled change/i }),
    ).toBeNull()
  })

  it('hides the pending banner when sub.pendingChange is null', async () => {
    stubAllOk()
    renderPage()
    await screen.findByText('Pro Monthly')
    expect(screen.queryByText(/plan change scheduled/i)).toBeNull()
    expect(screen.queryByText(/switching to/i)).toBeNull()
  })

  it('keeps Cancel subscription enabled even while a pendingChange exists', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, pendingChange: PENDING_CHANGE } })
    renderPage()
    await screen.findByText(/plan change scheduled/i)
    const cancelBtn = screen.getByRole('button', {
      name: /^cancel subscription$/i,
    })
    expect(cancelBtn).toBeEnabled()
    expect(
      screen.queryByText(/cancel the scheduled plan change first/i),
    ).toBeNull()
  })

  it('relabels Change plan to "Change scheduled plan" when one is queued', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, pendingChange: PENDING_CHANGE } })
    renderPage()
    await screen.findByText(/plan change scheduled/i)
    expect(
      screen.getByRole('button', { name: /^change scheduled plan$/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /^change plan$/i }),
    ).toBeNull()
  })

  it('cancels the scheduled change from inside the Change scheduled plan tile', async () => {
    vi.spyOn(subscriptionsApi, 'getCurrentSubscription')
      .mockResolvedValueOnce({ ...ACTIVE_SUB, pendingChange: PENDING_CHANGE })
      .mockResolvedValueOnce({ ...ACTIVE_SUB, pendingChange: null })
    vi.spyOn(settingsApi, 'getSettings').mockResolvedValue({ settings: [] })
    vi.spyOn(subscriptionsApi, 'listProducts').mockResolvedValue([
      PRO_MONTHLY,
      PRO_YEARLY,
    ])
    const cancelSpy = vi
      .spyOn(subscriptionsApi, 'cancelScheduledChange')
      .mockResolvedValue()
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^change scheduled plan$/i }),
    )
    const cancelBtn = await screen.findByRole('button', {
      name: /^cancel scheduled change$/i,
    })
    await userEvent.click(cancelBtn)
    await waitFor(() => expect(cancelSpy).toHaveBeenCalledWith('tok'))
    await waitFor(() =>
      expect(screen.queryByText(/plan change scheduled/i)).toBeNull(),
    )
  })

  it('warns inside the cancel-confirm panel that a scheduled change will also be cancelled', async () => {
    stubAllOk({ sub: { ...ACTIVE_SUB, pendingChange: PENDING_CHANGE } })
    renderPage()
    await userEvent.click(
      await screen.findByRole('button', { name: /^cancel subscription$/i }),
    )
    expect(
      screen.getByText(/scheduled change to/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/will also be cancelled/i)).toBeInTheDocument()
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
})


