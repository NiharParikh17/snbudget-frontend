/**
 * Price formatting helpers for subscription products.
 *
 * The Subscription Management API returns `price` as a bare decimal `number`
 * with no currency code. Until the backend exposes a currency field we
 * hard-code USD; centralize all formatting here so swapping it is a one-line
 * change. See `documents/changelog.md` (Unreleased TODO).
 */

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const CADENCE_LABEL = {
  WEEKLY: 'week',
  MONTHLY: 'month',
  YEARLY: 'year',
}

/** Just the money portion, e.g. `"$9.99"`. */
export function formatAmount(price) {
  return USD.format(Number(price ?? 0))
}

/**
 * `"$9.99 / month"` for recurring plans, `"$199 one-time"` for LIFETIME.
 * Falls back to just the amount for unknown billing cycles.
 *
 * @param {{ price: number, billingCycle: string }} product
 */
export function formatPrice({ price, billingCycle }) {
  const amount = formatAmount(price)
  if (billingCycle === 'LIFETIME') return `${amount} one-time`
  const cadence = CADENCE_LABEL[billingCycle]
  return cadence ? `${amount} / ${cadence}` : amount
}

/**
 * Display order for a plan grid: most popular cadences first.
 * Anything not listed sorts to the end, alphabetically by name.
 */
const CYCLE_ORDER = ['MONTHLY', 'YEARLY', 'LIFETIME', 'WEEKLY']

export function compareProducts(a, b) {
  const ai = CYCLE_ORDER.indexOf(a.billingCycle)
  const bi = CYCLE_ORDER.indexOf(b.billingCycle)
  const aRank = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
  const bRank = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
  if (aRank !== bRank) return aRank - bRank
  return (a.name || '').localeCompare(b.name || '')
}

