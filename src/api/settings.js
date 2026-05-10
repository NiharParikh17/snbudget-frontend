/**
 * Wrappers for the SNBudget User Settings API. All routes are exposed by
 * the gateway under `/api/settings`.
 *
 * Forward-compat policy
 * ---------------------
 * The backend is the source of truth for which settings exist; it returns
 * **every** known key on every read (unset keys carry their declared
 * default). The frontend keeps its own allow-list of keys it knows how to
 * render in `KNOWN_SETTING_KEYS` and silently drops anything not in that
 * set via `pickKnown()`. This lets the backend roll out new settings
 * before the UI for them ships, without breaking the frontend.
 *
 * To expose a new setting in the UI: add its key to `KNOWN_SETTING_KEYS`
 * and render it in `pages/Settings.jsx` according to `valueType`.
 */
import { request } from '../lib/apiClient.js'

const BASE = '/api/settings'

/**
 * Setting keys the frontend knows how to render today.
 *
 * Intentionally empty for now — the Settings page only surfaces
 * subscription management. Future preferences (e.g. `'THEME'`,
 * `'NOTIFICATIONS_EMAIL_ENABLED'`) will be added one-by-one as their UI
 * lands.
 *
 * @type {Set<string>}
 */
export const KNOWN_SETTING_KEYS = new Set()

/**
 * Filter a `UserSettingsResponse` down to the keys the frontend renders.
 * Tolerates a missing / malformed `settings` array (returns `[]`).
 *
 * @param {{ settings?: Array<{ key: string }> } | null | undefined} response
 * @returns {Array<object>}
 */
export function pickKnown(response) {
  const list = response && Array.isArray(response.settings) ? response.settings : []
  return list.filter((s) => s && KNOWN_SETTING_KEYS.has(s.key))
}

/**
 * Get every setting for the authenticated user. Every known key is always
 * returned by the backend; unset keys carry their declared defaults.
 *
 * @param {string} accessToken
 * @returns {Promise<{
 *   settings: Array<{
 *     key: string,
 *     value: string,
 *     defaultValue: string,
 *     valueType: 'BOOLEAN'|'INTEGER'|'DECIMAL'|'STRING'|'ENUM',
 *     allowedValues: string[],
 *   }>
 * }>}
 */
export function getSettings(accessToken) {
  return request('GET', `${BASE}/me`, { accessToken })
}

/**
 * Partially update settings. Only provided keys are written. Returns the
 * full updated settings map.
 *
 * @param {string} accessToken
 * @param {Record<string, string>} settings  Map of setting key → new value.
 * @returns {Promise<object>} the same shape as `getSettings`.
 */
export function updateSettings(accessToken, settings) {
  return request('PATCH', `${BASE}/me`, {
    accessToken,
    body: { settings },
  })
}

