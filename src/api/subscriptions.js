/**
 * Wrappers for the SNBudget Subscription Management API. All routes are
 * exposed by the gateway under `/api/subscriptions`.
 *
 * See `documents/architecture.md` → "Backend integration" for the gateway
 * topology, and the swagger spec for full request/response shapes.
 */
import { request } from '../lib/apiClient.js'

const BASE = '/api/subscriptions'

/**
 * List every active subscription product (the public catalog).
 * Requires a valid bearer token.
 *
 * @param {string} accessToken
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   description?: string,
 *   billingCycle: 'WEEKLY'|'MONTHLY'|'YEARLY'|'LIFETIME',
 *   price: number,
 *   status: 'ACTIVE'|'INACTIVE'|'DEPRECATED',
 *   createdAt: string,
 *   updatedAt: string,
 * }>>}
 */
export function listProducts(accessToken) {
  return request('GET', `${BASE}/products`, { accessToken })
}

/**
 * Get the caller's current active subscription, if any.
 *
 * Contract: the backend returns `204 No Content` when the caller has no
 * active subscription. `request()` parses an empty body as `null`, so a
 * `null` return value here means "no active subscription".
 *
 * @param {string} accessToken
 * @returns {Promise<null | {
 *   id: string,
 *   product: object,
 *   status: 'ACTIVE'|'CANCELLED'|'EXPIRED',
 *   autoRenew: boolean,
 *   startedAt: string,
 *   expiresAt: string|null,
 *   cancelledAt: string|null,
 *   createdAt: string,
 * }>}
 */
export function getCurrentSubscription(accessToken) {
  return request('GET', `${BASE}/me`, { accessToken })
}

/**
 * Subscribe the caller to a product. Fails (HTTP 4xx) if an active
 * subscription already exists.
 *
 * Note: there is no payment step yet — the backend simply records the
 * subscription. A real checkout flow will be added in a follow-up change.
 *
 * @param {string} accessToken
 * @param {{ productId: string, autoRenew?: boolean }} payload
 *   `autoRenew` defaults to `true`. The backend forces it to `false` for
 *   LIFETIME products regardless of what we send.
 * @returns {Promise<object>} the newly created UserSubscriptionResponse.
 */
export function subscribe(accessToken, { productId, autoRenew = true }) {
  return request('POST', `${BASE}/`, {
    accessToken,
    body: { productId, autoRenew },
  })
}

