import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'
import {
  cancelScheduledChange,
  cancelSubscription,
  getCurrentSubscription,
  listProducts,
  requestProductChange,
} from '../api/subscriptions.js'
import { getSettings, pickKnown } from '../api/settings.js'
import { compareProducts, formatAmount, formatPrice } from '../lib/price.js'

/**
 * Settings — authenticated subscription-management hub.
 *
 * Surfaces every user-callable action on the Subscription Management API
 * (view current plan + any pending scheduled change, change plan, cancel)
 * plus a placeholder Preferences card backed by `getSettings` with a
 * frontend known-keys allow-list (currently empty — see
 * `src/api/settings.js`).
 *
 * UX rules:
 *  - A pending scheduled change is surfaced as a **top-of-page notice**
 *    (no buttons inside) so users see "what's next" immediately. The
 *    notice points to the **Change scheduled plan** action below, which
 *    opens the single tile that hosts every scheduled-plan operation
 *    (swap target plan **or** cancel the scheduled change).
 *  - Auto-renew is **not** a checkbox. The industry standard for
 *    consumer subscriptions is to express "stop renewing" through a
 *    single Cancel subscription action — that's what we do here. Cancel
 *    is always allowed and, when a pending change is queued, the cancel
 *    confirm panel makes it explicit that the scheduled change is
 *    dropped too.
 *
 * Each card loads + errors + retries independently so a flake in one API
 * doesn't take the whole page down.
 *
 * `GET /api/subscriptions/me` returns the current subscription **and**
 * its `pendingChange` (or `null`) in a single call, so we no longer hit
 * `/me/history` from this page.
 */

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return dateFmt.format(d)
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


  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState(null)
  const [settingsReloadKey, setSettingsReloadKey] = useState(0)

  // UI mode for the in-page panels.
  const [mode, setMode] = useState('idle') // 'idle' | 'changing' | 'cancelling'


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
  const pendingChange = sub?.pendingChange ?? null
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

  // True when the user is "changing" to the plan they've already
  // scheduled — submitting would be a no-op round-trip to the backend.
  // Used to disable Schedule change AND to short-circuit the handler so
  // even a programmatic call avoids the network request.
  const isAlreadyScheduledTarget =
    !!pendingChange &&
    !!effectiveChangeTargetId &&
    pendingChange.targetProduct?.id === effectiveChangeTargetId

  // --- Mutations ----------------------------------------------------------


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
    // No-op guard: the picked target is already the scheduled change.
    // The button is also disabled in this case, but we belt-and-brace
    // here so a programmatic / stale click never hits the backend.
    if (isAlreadyScheduledTarget) {
      setMode('idle')
      setChangeError(null)
      setChangeTargetId(null)
      return
    }
    setChangeSubmitting(true)
    setChangeError(null)
    try {
      await requestProductChange(accessToken, {
        targetProductId: effectiveChangeTargetId,
        effectiveType: 'NEXT_BILLING_CYCLE',
      })
      // Refresh the subscription so the pending-change banner appears.
      setSubscriptionReloadKey((k) => k + 1)
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
  }, [accessToken, effectiveChangeTargetId, changeSubmitting, isAlreadyScheduledTarget])

  const handleCancelScheduledChange = useCallback(async () => {
    if (cancelChangeSubmitting) return
    setCancelChangeSubmitting(true)
    setCancelChangeError(null)
    try {
      await cancelScheduledChange(accessToken)
      setSubscriptionReloadKey((k) => k + 1)
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

        {/* --- Top-of-page pending-change notice ----------------------
            Surfaces the next billing-cycle plan switch front-and-center
            so it's the first thing the user sees. Intentionally
            actionless — every scheduled-plan operation lives in the
            "Change scheduled plan" panel below. */}
        {sub && pendingChange ? (
          <div
            role="status"
            className="mt-8 rounded-2xl border border-violet-300 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/30 px-5 py-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
              Plan change scheduled
            </p>
            <p className="mt-1 text-sm text-slate-900 dark:text-white">
              Switching to{' '}
              {pendingChange.targetProduct?.name ? (
                <strong>{pendingChange.targetProduct.name}</strong>
              ) : (
                'a new plan'
              )}
              {pendingChange.targetProduct
                ? ` (${formatPrice(pendingChange.targetProduct)})`
                : ''}
              {pendingChange.effectiveType === 'NEXT_BILLING_CYCLE'
                ? ' at your next billing cycle.'
                : pendingChange.effectiveDate
                  ? ` on ${formatDate(pendingChange.effectiveDate)}.`
                  : '.'}
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              Use <em>Change scheduled plan</em> below to swap or cancel
              this change.
            </p>
          </div>
        ) : null}

        {/* --- Subscription card ------------------------------------- */}
        <div className={pendingChange ? 'mt-6' : 'mt-10'}>
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
                        {isCancelled
                          ? 'Access ends'
                          : sub.autoRenew
                            ? 'Renews on'
                            : 'Ends on'}
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

                {/* Action buttons. The backend exposes `changeable` and
                    `cancellable` per subscription; we hide an action when
                    its flag is false (e.g. a LIFETIME plan typically has
                    `cancellable: false` because there's nothing to
                    cancel). If both are unavailable we render a short
                    explainer in place of the buttons.

                    Cancellation is always allowed when `cancellable` is
                    true — even with a `pendingChange` queued. The cancel
                    confirm panel makes it clear that the scheduled
                    change is dropped along with the subscription. */}
                {!isCancelled ? (
                  sub.changeable === false && sub.cancellable === false ? (
                    <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                      This plan can&apos;t be changed or cancelled.
                    </p>
                  ) : (
                    <div className="mt-6 flex flex-wrap gap-3">
                      {sub.changeable !== false ? (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setMode('changing')
                            setChangeError(null)
                            setCancelChangeError(null)
                          }}
                          disabled={mode !== 'idle'}
                        >
                          {pendingChange ? 'Change scheduled plan' : 'Change plan'}
                        </Button>
                      ) : null}
                      {sub.cancellable !== false ? (
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
                      ) : null}
                    </div>
                  )
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

        {/* --- Change plan modal -----------------------------------
            Rendered as a portal-mounted dialog (via `Modal`) instead of
            an in-page tile so opening it doesn't shove the rest of the
            page around. The product grid mirrors `/choose-plan` —
            column cards with name + price + select state — so users see
            the same shape they used at signup. */}
        <Modal
          open={mode === 'changing'}
          onClose={() => {
            if (changeSubmitting || cancelChangeSubmitting) return
            setMode('idle')
            setChangeError(null)
            setCancelChangeError(null)
            setChangeTargetId(null)
          }}
          title={pendingChange ? 'Change scheduled plan' : 'Change your plan'}
          size="xl"
          closeOnEscape={!changeSubmitting && !cancelChangeSubmitting}
          closeOnBackdrop={!changeSubmitting && !cancelChangeSubmitting}
        >
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {pendingChange ? (
              <>
                Pick a different plan for your next billing cycle. This
                will replace your currently scheduled change to{' '}
                <strong>
                  {pendingChange.targetProduct?.name ?? 'the selected plan'}
                </strong>
                . You keep your current plan until then.
              </>
            ) : (
              'Pick a new plan. The change will take effect at your next billing cycle — you keep your current plan until then.'
            )}
          </p>

          {products === null ? (
            <div
              className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-live="polite"
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  data-testid="products-skeleton"
                  className="h-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse"
                />
              ))}
            </div>
          ) : productsError ? (
            <div className="mt-6">
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
            <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
              No other plans are available right now.
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Available plans"
              className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {otherProducts.map((p) => {
                const selected = p.id === effectiveChangeTargetId
                return (
                  <label
                    key={p.id}
                    className={`relative flex flex-col rounded-2xl border bg-white dark:bg-slate-900 p-5 cursor-pointer shadow-sm transition-all duration-200 focus-within:ring-2 focus-within:ring-violet-500 ${
                      selected
                        ? 'border-violet-500 ring-2 ring-violet-500/40 -translate-y-0.5'
                        : 'border-slate-200 dark:border-slate-800 hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-700'
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
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">
                      {p.name}
                    </span>
                    {p.description ? (
                      <span className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {p.description}
                      </span>
                    ) : null}
                    <span className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(p.price)}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {p.billingCycle === 'LIFETIME'
                          ? 'one-time'
                          : `/ ${formatPrice(p).split('/ ')[1] ?? ''}`}
                      </span>
                    </span>
                    <span className="mt-1 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {p.billingCycle.toLowerCase()} billing
                    </span>
                    <span
                      aria-hidden="true"
                      className={`mt-5 inline-flex items-center justify-center w-full rounded-xl border px-3 py-1.5 text-xs font-semibold ${
                        selected
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {selected ? 'Selected' : 'Select'}
                    </span>
                  </label>
                )
              })}
            </div>
          )}

          {changeError ? (
            <div className="mt-5">
              <ErrorBanner>{changeError}</ErrorBanner>
            </div>
          ) : null}
          {cancelChangeError ? (
            <div className="mt-5">
              <ErrorBanner>{cancelChangeError}</ErrorBanner>
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={handleConfirmChange}
              disabled={
                changeSubmitting ||
                !effectiveChangeTargetId ||
                products === null ||
                cancelChangeSubmitting ||
                isAlreadyScheduledTarget
              }
              title={
                isAlreadyScheduledTarget
                  ? 'This plan is already scheduled — pick a different one to schedule a new change.'
                  : undefined
              }
            >
              {changeSubmitting ? 'Scheduling…' : 'Schedule change'}
            </Button>
            {isAlreadyScheduledTarget ? (
              <p className="basis-full -mt-1 text-xs text-slate-500 dark:text-slate-400">
                This plan is already scheduled for your next billing cycle.
                Pick a different one to schedule a new change, or cancel
                the scheduled change below.
              </p>
            ) : null}
            {pendingChange ? (
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await handleCancelScheduledChange()
                  setMode('idle')
                  setChangeTargetId(null)
                }}
                disabled={cancelChangeSubmitting || changeSubmitting}
                className="!text-red-700 dark:!text-red-300 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-950/40"
              >
                {cancelChangeSubmitting
                  ? 'Cancelling…'
                  : 'Cancel scheduled change'}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode('idle')
                setChangeError(null)
                setCancelChangeError(null)
                setChangeTargetId(null)
              }}
              disabled={changeSubmitting || cancelChangeSubmitting}
            >
              {pendingChange ? 'Close' : 'Keep current plan'}
            </Button>
          </div>
        </Modal>

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
              {pendingChange ? (
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                  Your scheduled change to{' '}
                  <strong>
                    {pendingChange.targetProduct?.name ?? 'a new plan'}
                  </strong>{' '}
                  will also be cancelled.
                </p>
              ) : null}
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

