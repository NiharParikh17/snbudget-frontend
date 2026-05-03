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

/**
 * Cancel the caller's active subscription.
 *
 * Backend semantics: the subscription transitions to `CANCELLED` but the
 * user typically retains access until `expiresAt`. The frontend re-runs
 * `getCurrentSubscription` after this call to reflect the new state; if
 * `/me` now returns `null` (204) the user must pick a new plan.
 *
 * @param {string} accessToken
 * @returns {Promise<unknown>} the API returns 200 with no documented body.
 */
export function cancelSubscription(accessToken) {
  return request('DELETE', `${BASE}/me`, { accessToken })
}

/**
 * Update the auto-renew flag on the caller's active subscription. Not
 * applicable for LIFETIME subscriptions — the backend will reject those.
 *
 * @param {string} accessToken
 * @param {{ autoRenew: boolean }} payload
 * @returns {Promise<object>} the updated UserSubscriptionResponse.
 */
export function updateAutoRenew(accessToken, { autoRenew }) {
  return request('PATCH', `${BASE}/me/auto-renew`, {
    accessToken,
    body: { autoRenew },
  })
}

/**
 * Request a product change on the caller's active subscription.
 *
 * The frontend currently only ships `effectiveType: 'NEXT_BILLING_CYCLE'`
 * (no immediate / on-date selectors yet) but the wrapper accepts any value
 * the backend supports so future UI work can opt in without an API change.
 *
 * @param {string} accessToken
 * @param {{
 *   targetProductId: string,
 *   effectiveType: 'IMMEDIATE'|'ON_DATE'|'NEXT_BILLING_CYCLE'|'NEXT_BILLING_CYCLE_AFTER_DATE',
 *   effectiveDate?: string,
 * }} payload
 * @returns {Promise<object>} ScheduledProductChangeResponse.
 */
export function requestProductChange(accessToken, payload) {
  return request('POST', `${BASE}/me/change`, { accessToken, body: payload })
}

/**
 * Cancel the pending scheduled product change for the caller's active
 * subscription.
 *
 * @param {string} accessToken
 * @returns {Promise<unknown>}
 */
export function cancelScheduledChange(accessToken) {
  return request('DELETE', `${BASE}/me/change`, { accessToken })
}

/**
 * Get the caller's subscription event history, ordered most-recent first.
 *
 * No dedicated `GET /me/change` endpoint exists yet, so the Settings page
 * also derives "is there a pending product change?" from this history
 * (latest `CHANGE_SCHEDULED` not followed by `CHANGE_CANCELLED` /
 * `CHANGE_APPLIED`). Remove that inference once the backend exposes a
 * direct read.
 *
 * @param {string} accessToken
 * @returns {Promise<Array<{
 *   id: string,
 *   subscriptionId: string,
 *   eventType: 'SUBSCRIBED'|'AUTO_RENEWED'|'CANCELLED'|'EXPIRED'|'AMENDED'|'CHANGE_SCHEDULED'|'CHANGE_CANCELLED',
 *   metadata?: string,
 *   createdAt: string,
 * }>>}
 */
export function getSubscriptionHistory(accessToken) {
  return request('GET', `${BASE}/me/history`, { accessToken })
}
