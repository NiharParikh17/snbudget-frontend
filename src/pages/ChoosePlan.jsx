import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'
import { listProducts } from '../api/subscriptions.js'
import { compareProducts, formatAmount, formatPrice } from '../lib/price.js'

/**
 * ChoosePlan — shown to authenticated users who have no active subscription.
 *
 * For now this screen is informational only: the user can preview plans and
 * select one for keyboard / visual feedback, but the **Continue** button is
 * intentionally disabled ("Coming soon"). The actual `POST /api/subscriptions`
 * call lands in a follow-up change.
 *
 * Active subscribers are bounced back to `/welcome`; anonymous users are
 * filtered out one level up by `RequireAuth`.
 */
function ChoosePlan() {
  const { accessToken, subscriptionStatus, logout } = useAuth()
  const navigate = useNavigate()

  // `products === null` is the "still loading" sentinel; once the request
  // resolves (success or failure) we move it to an array. This makes the
  // loading flag a pure derivation rather than a separate piece of state
  // that has to be kept in sync inside an effect (lint rule
  // `react-hooks/set-state-in-effect`).
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const cardRefs = useRef({})

  useEffect(() => {
    if (!accessToken) return undefined
    let cancelled = false
    const run = async () => {
      try {
        const list = await listProducts(accessToken)
        if (cancelled) return
        setProducts(Array.isArray(list) ? list : [])
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Could not load subscription plans. Please try again.',
        )
        setProducts([])
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [accessToken, reloadKey])

  function retry() {
    setProducts(null)
    setError(null)
    setReloadKey((k) => k + 1)
  }

  const loading = products === null
  const sortedProducts = useMemo(
    () => (products ? [...products].sort(compareProducts) : []),
    [products],
  )

  // Derive the effective selection — pre-selecting the first card without
  // a setState-in-effect cascade.
  const effectiveSelectedId =
    selectedId && sortedProducts.some((p) => p.id === selectedId)
      ? selectedId
      : sortedProducts[0]?.id ?? null

  // "Best value" heuristic: a YEARLY plan whose annual price is strictly
  // cheaper than 12× any MONTHLY plan in the catalog.
  const bestValueYearlyId = useMemo(() => {
    const monthlyMin = sortedProducts
      .filter((p) => p.billingCycle === 'MONTHLY')
      .reduce((min, p) => Math.min(min, Number(p.price) || 0), Infinity)
    if (!Number.isFinite(monthlyMin)) return null
    const yearly = sortedProducts.find(
      (p) => p.billingCycle === 'YEARLY' && Number(p.price) < monthlyMin * 12,
    )
    return yearly?.id ?? null
  }, [sortedProducts])

  function handleKeyDown(event) {
    if (sortedProducts.length === 0) return
    const idx = sortedProducts.findIndex((p) => p.id === effectiveSelectedId)
    let next
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = idx < sortedProducts.length - 1 ? idx + 1 : 0
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = idx > 0 ? idx - 1 : sortedProducts.length - 1
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = sortedProducts.length - 1
    } else {
      return
    }
    event.preventDefault()
    const nextProduct = sortedProducts[next]
    setSelectedId(nextProduct.id)
    cardRefs.current[nextProduct.id]?.focus()
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      navigate('/', { replace: true })
    }
  }

  // Active subscribers should never see this screen.
  if (subscriptionStatus === 'active') {
    return <Navigate to="/welcome" replace />
  }

  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-5xl mx-auto">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Choose your plan
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pick the plan that fits you.
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            SNBudget is a paid product. Choose a plan to get started — you
            can change or cancel any time later.
          </p>
        </header>

        {loading ? (
          <div
            className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            aria-busy="true"
            aria-live="polite"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                data-testid="plan-skeleton"
                className="h-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-12 max-w-md mx-auto text-center">
            <div
              role="alert"
              className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </div>
            <div className="mt-6">
              <Button type="button" onClick={retry}>
                Try again
              </Button>
            </div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="mt-12 max-w-md mx-auto text-center">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              No plans are available right now
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-300">
              We&apos;re still finalizing pricing. Please check back soon — or
              sign out and we&apos;ll see you next time.
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div
              role="radiogroup"
              aria-label="Subscription plans"
              onKeyDown={handleKeyDown}
              className="mt-12 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sortedProducts.map((product) => {
                const isSelected = product.id === effectiveSelectedId
                const isBestValue = product.id === bestValueYearlyId
                return (
                  <div
                    key={product.id}
                    ref={(el) => {
                      cardRefs.current[product.id] = el
                    }}
                    role="radio"
                    aria-checked={isSelected}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => setSelectedId(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        setSelectedId(product.id)
                      }
                    }}
                    className={`relative cursor-pointer rounded-2xl border bg-white dark:bg-slate-900 p-6 text-left shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-500 ${
                      isSelected
                        ? 'border-violet-500 ring-2 ring-violet-500/40 -translate-y-0.5'
                        : 'border-slate-200 dark:border-slate-800 hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                  >
                    {isBestValue ? (
                      <span className="absolute -top-3 right-4 inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-violet-600 text-white shadow">
                        Best value
                      </span>
                    ) : null}

                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {product.name}
                    </h2>
                    {product.description ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {product.description}
                      </p>
                    ) : null}

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                        {formatAmount(product.price)}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {product.billingCycle === 'LIFETIME'
                          ? 'one-time'
                          : `/ ${formatPrice(product).split('/ ')[1] ?? ''}`}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {product.billingCycle.toLowerCase()} billing
                    </p>

                    <div
                      aria-hidden="true"
                      className={`mt-6 inline-flex items-center justify-center w-full rounded-xl border px-4 py-2 text-sm font-semibold ${
                        isSelected
                          ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200'
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              {/* The wrapping span is required for `title` to show on a
                  disabled <button> in most browsers. */}
              <span title="Coming soon" className="inline-block">
                <Button
                  type="button"
                  disabled
                  aria-disabled="true"
                  aria-describedby="continue-help"
                >
                  Continue
                </Button>
              </span>
              <p
                id="continue-help"
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                Subscriptions aren&apos;t live yet — checkout is coming soon.
              </p>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-2 text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 underline disabled:opacity-50"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ChoosePlan




