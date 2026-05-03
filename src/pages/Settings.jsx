import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'
import {
  cancelScheduledChange,
  cancelSubscription,
  getCurrentSubscription,
  getSubscriptionHistory,
  listProducts,
  requestProductChange,
  updateAutoRenew,
} from '../api/subscriptions.js'
import { getSettings, pickKnown } from '../api/settings.js'
import { compareProducts, formatPrice } from '../lib/price.js'

/**
 * Settings — authenticated subscription-management hub.
 *
 * Surfaces every user-callable action on the Subscription Management API
 * (view current plan, toggle auto-renew, change plan, cancel, view event
 * history) plus a placeholder Preferences card backed by `getSettings`
 * with a frontend known-keys allow-list (currently empty — see
 * `src/api/settings.js`).
 *
 * Each card loads + errors + retries independently so a flake in one API
 * doesn't take the whole page down.
 *
 * Pending product change is **inferred from history** (latest
 * `CHANGE_SCHEDULED` not followed by `CHANGE_CANCELLED` / `CHANGE_APPLIED`)
 * because the backend does not yet expose `GET /me/change`. Tracked as a
 * TODO in `documents/changelog.md`.
 */

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return dateFmt.format(d)
}

function formatDateTime(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return dateTimeFmt.format(d)
}

const EVENT_LABEL = {
  SUBSCRIBED: 'Subscribed',
  AUTO_RENEWED: 'Auto-renewed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  AMENDED: 'Updated',
  CHANGE_SCHEDULED: 'Plan change scheduled',
  CHANGE_CANCELLED: 'Plan change cancelled',
  CHANGE_APPLIED: 'Plan change applied',
}

/**
 * Walk newest-first history and return the still-pending CHANGE_SCHEDULED
 * event, if any. A scheduled change is considered "live" until a more
 * recent CHANGE_CANCELLED, CHANGE_APPLIED, or AMENDED event supersedes it.
 */
function findPendingScheduledChange(history) {
  if (!Array.isArray(history)) return null
  for (const event of history) {
    if (
      event?.eventType === 'CHANGE_CANCELLED' ||
      event?.eventType === 'CHANGE_APPLIED'
    ) {
      return null
    }
    if (event?.eventType === 'CHANGE_SCHEDULED') return event
  }
  return null
}

function StatusBadge({ status }) {
  const styles =
    status === 'ACTIVE'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      : status === 'CANCELLED'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full border ${styles}`}
    >
      {status}
    </span>
  )
}

function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  )
}

function ErrorBanner({ children, onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <span>{children}</span>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

function Settings() {
  const { accessToken, refreshSubscription } = useAuth()
  const navigate = useNavigate()

  // Independent fetch slots — `null` is the loading sentinel.
  const [subscription, setSubscription] = useState(null)
  const [subscriptionError, setSubscriptionError] = useState(null)
  const [subscriptionReloadKey, setSubscriptionReloadKey] = useState(0)

  const [history, setHistory] = useState(null)
  const [historyError, setHistoryError] = useState(null)
  const [historyReloadKey, setHistoryReloadKey] = useState(0)

  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState(null)
  const [settingsReloadKey, setSettingsReloadKey] = useState(0)

  // UI mode for the in-page panels.
  const [mode, setMode] = useState('idle') // 'idle' | 'changing' | 'cancelling'

  // Auto-renew interaction state.
  const [autoRenewSubmitting, setAutoRenewSubmitting] = useState(false)
  const [autoRenewError, setAutoRenewError] = useState(null)

  // Cancel-subscription interaction state.
  const [cancelSubmitting, setCancelSubmitting] = useState(false)
  const [cancelError, setCancelError] = useState(null)

  // Change-plan interaction state.
  const [products, setProducts] = useState(null)
  const [productsError, setProductsError] = useState(null)
  const [productsReloadKey, setProductsReloadKey] = useState(0)
  const [changeTargetId, setChangeTargetId] = useState(null)
  const [changeSubmitting, setChangeSubmitting] = useState(false)
  const [changeError, setChangeError] = useState(null)

  // Cancel-scheduled-change interaction state.
  const [cancelChangeSubmitting, setCancelChangeSubmitting] = useState(false)
  const [cancelChangeError, setCancelChangeError] = useState(null)

  // --- Loaders -----------------------------------------------------------

  useEffect(() => {
    if (!accessToken) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const sub = await getCurrentSubscription(accessToken)
        if (cancelled) return
        setSubscription(sub ?? 'none')
        setSubscriptionError(null)
      } catch (err) {
        if (cancelled) return
        setSubscriptionError(
          err instanceof ApiError
            ? err.message
            : 'Could not load your subscription. Please try again.',
        )
        setSubscription('none')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, subscriptionReloadKey])

  useEffect(() => {
    if (!accessToken) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await getSubscriptionHistory(accessToken)
        if (cancelled) return
        setHistory(Array.isArray(list) ? list : [])
        setHistoryError(null)
      } catch (err) {
        if (cancelled) return
        setHistoryError(
          err instanceof ApiError
            ? err.message
            : 'Could not load your subscription activity.',
        )
        setHistory([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, historyReloadKey])

  useEffect(() => {
    if (!accessToken) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const result = await getSettings(accessToken)
        if (cancelled) return
        setSettings(pickKnown(result))
        setSettingsError(null)
      } catch (err) {
        if (cancelled) return
        setSettingsError(
          err instanceof ApiError
            ? err.message
            : 'Could not load your preferences.',
        )
        setSettings([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, settingsReloadKey])

  // Lazy-load products only when the user opens the Change plan panel.
  useEffect(() => {
    if (mode !== 'changing' || !accessToken) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listProducts(accessToken)
        if (cancelled) return
        setProducts(Array.isArray(list) ? list : [])
        setProductsError(null)
      } catch (err) {
        if (cancelled) return
        setProductsError(
          err instanceof ApiError
            ? err.message
            : 'Could not load available plans.',
        )
        setProducts([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, mode, productsReloadKey])

  // --- Derivations --------------------------------------------------------

  const sub = typeof subscription === 'object' ? subscription : null
  const pendingChange = useMemo(
    () => findPendingScheduledChange(history),
    [history],
  )
  const otherProducts = useMemo(() => {
    if (!Array.isArray(products) || !sub?.product?.id) return []
    return [...products]
      .filter((p) => p.id !== sub.product.id)
      .sort(compareProducts)
  }, [products, sub])

  // Default the change-target to the first available alternative.
  const effectiveChangeTargetId =
    changeTargetId && otherProducts.some((p) => p.id === changeTargetId)
      ? changeTargetId
      : otherProducts[0]?.id ?? null

  // --- Mutations ----------------------------------------------------------

  const handleAutoRenewToggle = useCallback(async () => {
    if (!sub || autoRenewSubmitting) return
    const nextValue = !sub.autoRenew
    // Optimistic update.
    setAutoRenewSubmitting(true)
    setAutoRenewError(null)
    setSubscription({ ...sub, autoRenew: nextValue })
    try {
      const updated = await updateAutoRenew(accessToken, {
        autoRenew: nextValue,
      })
      setSubscription(updated)
    } catch (err) {
      // Roll back.
      setSubscription(sub)
      setAutoRenewError(
        err instanceof ApiError
          ? err.message
          : 'Could not update auto-renew. Please try again.',
      )
    } finally {
      setAutoRenewSubmitting(false)
    }
  }, [accessToken, sub, autoRenewSubmitting])

  const handleConfirmCancel = useCallback(async () => {
    if (!sub || cancelSubmitting) return
    setCancelSubmitting(true)
    setCancelError(null)
    try {
      await cancelSubscription(accessToken)
      await refreshSubscription()
      // Re-read the current subscription to see whether the backend kept
      // it visible (CANCELLED with access until expiresAt) or dropped it.
      try {
        const fresh = await getCurrentSubscription(accessToken)
        if (fresh) {
          setSubscription(fresh)
          setMode('idle')
          setHistoryReloadKey((k) => k + 1)
        } else {
          // No active subscription anymore — RequireSubscription will route
          // future renders, but we navigate explicitly for immediacy.
          navigate('/choose-plan', { replace: true })
        }
      } catch {
        // Fall back to a refetch on next mount.
        setSubscriptionReloadKey((k) => k + 1)
        setMode('idle')
      }
    } catch (err) {
      setCancelError(
        err instanceof ApiError
          ? err.message
          : 'Could not cancel your subscription. Please try again.',
      )
    } finally {
      setCancelSubmitting(false)
    }
  }, [accessToken, sub, cancelSubmitting, refreshSubscription, navigate])

  const handleConfirmChange = useCallback(async () => {
    if (!effectiveChangeTargetId || changeSubmitting) return
    setChangeSubmitting(true)
    setChangeError(null)
    try {
      await requestProductChange(accessToken, {
        targetProductId: effectiveChangeTargetId,
        effectiveType: 'NEXT_BILLING_CYCLE',
      })
      // Refresh history so the pending-change banner appears.
      setHistoryReloadKey((k) => k + 1)
      setMode('idle')
      setChangeTargetId(null)
    } catch (err) {
      setChangeError(
        err instanceof ApiError
          ? err.message
          : 'Could not schedule the plan change. Please try again.',
      )
    } finally {
      setChangeSubmitting(false)
    }
  }, [accessToken, effectiveChangeTargetId, changeSubmitting])

  const handleCancelScheduledChange = useCallback(async () => {
    if (cancelChangeSubmitting) return
    setCancelChangeSubmitting(true)
    setCancelChangeError(null)
    try {
      await cancelScheduledChange(accessToken)
      setHistoryReloadKey((k) => k + 1)
    } catch (err) {
      setCancelChangeError(
        err instanceof ApiError
          ? err.message
          : 'Could not cancel the scheduled plan change.',
      )
    } finally {
      setCancelChangeSubmitting(false)
    }
  }, [accessToken, cancelChangeSubmitting])

  // --- Render -------------------------------------------------------------

  const subscriptionLoading = subscription === null
  const product = sub?.product
  const isLifetime = product?.billingCycle === 'LIFETIME'
  const isCancelled = sub?.status === 'CANCELLED'
  const accessEndsOn = formatDate(sub?.expiresAt)

  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <header>
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Settings
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            Account &amp; subscription
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Manage your subscription, review your activity, and (soon)
            adjust your in-app preferences.
          </p>
        </header>

        {/* --- Subscription card ------------------------------------- */}
        <div className="mt-10">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Subscription
              </h2>
              {sub ? <StatusBadge status={sub.status} /> : null}
            </div>

            {subscriptionLoading ? (
              <div
                data-testid="subscription-skeleton"
                className="mt-6 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                aria-busy="true"
                aria-live="polite"
              />
            ) : subscriptionError ? (
              <div className="mt-6">
                <ErrorBanner
                  onRetry={() => {
                    setSubscription(null)
                    setSubscriptionError(null)
                    setSubscriptionReloadKey((k) => k + 1)
                  }}
                >
                  {subscriptionError}
                </ErrorBanner>
              </div>
            ) : !sub ? (
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                You don&apos;t have an active subscription.
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {product?.name}
                  </p>
                  {product?.description ? (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {product.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-slate-700 dark:text-slate-200">
                    {product ? formatPrice(product) : null}
                  </p>
                </div>

                <dl className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  {sub.startedAt ? (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">
                        Started
                      </dt>
                      <dd className="text-slate-800 dark:text-slate-100">
                        {formatDate(sub.startedAt)}
                      </dd>
                    </div>
                  ) : null}
                  {sub.expiresAt ? (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">
                        {isCancelled ? 'Access ends' : 'Renews / ends'}
                      </dt>
                      <dd className="text-slate-800 dark:text-slate-100">
                        {formatDate(sub.expiresAt)}
                      </dd>
                    </div>
                  ) : null}
                  {sub.cancelledAt ? (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">
                        Cancelled
                      </dt>
                      <dd className="text-slate-800 dark:text-slate-100">
                        {formatDate(sub.cancelledAt)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {/* Auto-renew */}
                {!isLifetime && !isCancelled ? (
                  <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        Auto-renew
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {sub.autoRenew
                          ? 'Your plan will renew automatically when it expires.'
                          : 'Your plan will end on the renewal date.'}
                      </p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer select-none">
                      <span className="sr-only">Toggle auto-renew</span>
                      <input
                        type="checkbox"
                        role="switch"
                        aria-label="Auto-renew"
                        checked={!!sub.autoRenew}
                        disabled={autoRenewSubmitting}
                        onChange={handleAutoRenewToggle}
                        className="h-5 w-5 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
                      />
                    </label>
                  </div>
                ) : null}
                {autoRenewError ? (
                  <div className="mt-3">
                    <ErrorBanner>{autoRenewError}</ErrorBanner>
                  </div>
                ) : null}

                {/* Action buttons */}
                {!isCancelled ? (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setMode('changing')
                        setChangeError(null)
                      }}
                      disabled={mode !== 'idle'}
                    >
                      Change plan
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setMode('cancelling')
                        setCancelError(null)
                      }}
                      disabled={mode !== 'idle'}
                      className="!text-red-700 dark:!text-red-300 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-950/40"
                    >
                      Cancel subscription
                    </Button>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
                    Your subscription is cancelled
                    {accessEndsOn
                      ? ` — you'll keep access until ${accessEndsOn}.`
                      : '.'}
                  </p>
                )}
              </>
            )}
          </Card>
        </div>

        {/* --- Pending scheduled change ----------------------------- */}
        {pendingChange ? (
          <div className="mt-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Plan change scheduled
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                A plan change is queued and will take effect at your next
                billing cycle.
                {pendingChange.metadata
                  ? ` Details: ${pendingChange.metadata}`
                  : ''}
              </p>
              {cancelChangeError ? (
                <div className="mt-3">
                  <ErrorBanner>{cancelChangeError}</ErrorBanner>
                </div>
              ) : null}
              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelScheduledChange}
                  disabled={cancelChangeSubmitting}
                >
                  {cancelChangeSubmitting
                    ? 'Cancelling…'
                    : 'Cancel scheduled change'}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* --- Change plan panel ----------------------------------- */}
        {mode === 'changing' ? (
          <div className="mt-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Change your plan
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Pick a new plan. The change will take effect at your next
                billing cycle — you keep your current plan until then.
              </p>

              {products === null ? (
                <div
                  data-testid="products-skeleton"
                  className="mt-4 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                  aria-busy="true"
                />
              ) : productsError ? (
                <div className="mt-4">
                  <ErrorBanner
                    onRetry={() => {
                      setProducts(null)
                      setProductsError(null)
                      setProductsReloadKey((k) => k + 1)
                    }}
                  >
                    {productsError}
                  </ErrorBanner>
                </div>
              ) : otherProducts.length === 0 ? (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                  No other plans are available right now.
                </p>
              ) : (
                <div
                  role="radiogroup"
                  aria-label="Available plans"
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  {otherProducts.map((p) => {
                    const selected = p.id === effectiveChangeTargetId
                    return (
                      <label
                        key={p.id}
                        className={`flex flex-col gap-1 rounded-xl border p-4 cursor-pointer transition-all ${
                          selected
                            ? 'border-violet-500 ring-2 ring-violet-500/30 bg-violet-50/50 dark:bg-violet-900/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="change-target"
                          value={p.id}
                          checked={selected}
                          onChange={() => setChangeTargetId(p.id)}
                          className="sr-only"
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {formatPrice(p)}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {changeError ? (
                <div className="mt-4">
                  <ErrorBanner>{changeError}</ErrorBanner>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleConfirmChange}
                  disabled={
                    changeSubmitting ||
                    !effectiveChangeTargetId ||
                    products === null
                  }
                >
                  {changeSubmitting ? 'Scheduling…' : 'Schedule change'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode('idle')
                    setChangeError(null)
                    setChangeTargetId(null)
                  }}
                  disabled={changeSubmitting}
                >
                  Keep current plan
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* --- Cancel confirmation panel --------------------------- */}
        {mode === 'cancelling' ? (
          <div className="mt-6">
            <Card>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Cancel your subscription?
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                If you cancel, you&apos;ll lose access to:
              </p>
              <ul className="mt-2 ml-5 list-disc text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <li>Personal budgets and category tracking</li>
                <li>Expense splitting with other users</li>
                <li>Running balances and settle-up</li>
              </ul>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {accessEndsOn
                  ? `You'll keep access until ${accessEndsOn}. Your data is retained until you delete your account.`
                  : 'Your data is retained until you delete your account.'}
              </p>

              {cancelError ? (
                <div className="mt-4">
                  <ErrorBanner>{cancelError}</ErrorBanner>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMode('idle')
                    setCancelError(null)
                  }}
                  disabled={cancelSubmitting}
                >
                  Keep my subscription
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelSubmitting}
                  className="!bg-red-600 hover:!bg-red-500 active:!bg-red-700"
                >
                  {cancelSubmitting
                    ? 'Cancelling…'
                    : 'Yes, cancel subscription'}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* --- Activity card --------------------------------------- */}
        <div className="mt-6">
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Activity
            </h2>
            {history === null ? (
              <div
                data-testid="history-skeleton"
                className="mt-4 h-20 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                aria-busy="true"
              />
            ) : historyError ? (
              <div className="mt-4">
                <ErrorBanner
                  onRetry={() => {
                    setHistory(null)
                    setHistoryError(null)
                    setHistoryReloadKey((k) => k + 1)
                  }}
                >
                  {historyError}
                </ErrorBanner>
              </div>
            ) : history.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                No activity yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
                {history.slice(0, 10).map((event) => (
                  <li
                    key={event.id}
                    className="py-3 flex items-start justify-between gap-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {EVENT_LABEL[event.eventType] ?? event.eventType}
                      </p>
                      {event.metadata ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {event.metadata}
                        </p>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDateTime(event.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* --- Preferences card ------------------------------------ */}
        <div className="mt-6">
          <Card>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Preferences
            </h2>
            {settings === null ? (
              <div
                data-testid="settings-skeleton"
                className="mt-4 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                aria-busy="true"
              />
            ) : settingsError ? (
              <div className="mt-4">
                <ErrorBanner
                  onRetry={() => {
                    setSettings(null)
                    setSettingsError(null)
                    setSettingsReloadKey((k) => k + 1)
                  }}
                >
                  {settingsError}
                </ErrorBanner>
              </div>
            ) : settings.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                No preferences yet — controls will appear here as we add
                them.
              </p>
            ) : (
              // The frontend allow-list (`KNOWN_SETTING_KEYS`) is empty
              // today; this branch only runs once per-key UI has shipped.
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {settings.length} preference
                {settings.length === 1 ? '' : 's'} loaded.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Settings

