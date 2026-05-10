/**
 * Wrappers for the SNBudget Group Management API. All routes are exposed
 * by the gateway under `/api/groups`.
 *
 * Domain rules enforced server-side that the UI mirrors:
 *  - Every group has exactly one OWNER. Ownership is fixed for the
 *    lifetime of the group and cannot be transferred.
 *  - The owner cannot leave their group; they must delete it instead.
 *  - Any active member may add other members, remove other members,
 *    update the group's name/description, and update group settings.
 *
 * Forward-compat policy for group settings mirrors `src/api/settings.js`:
 * the backend returns every known key (with declared defaults for unset
 * keys); the frontend keeps its own `KNOWN_GROUP_SETTING_KEYS` allow-list
 * and silently drops anything not in that set via
 * `pickKnownGroupSettings()`.
 */
import { request } from '../lib/apiClient.js'

const BASE = '/api/groups'

// --- Groups ----------------------------------------------------------------

/**
 * List every group the authenticated user is an active member of.
 *
 * @param {string} accessToken
 * @returns {Promise<Array<GroupResponse>>}
 */
export function listMyGroups(accessToken) {
  return request('GET', `${BASE}/me`, { accessToken })
}

/**
 * Get a single group by id. Caller must be an active member.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @returns {Promise<GroupResponse>}
 */
export function getGroup(accessToken, groupId) {
  return request('GET', `${BASE}/${groupId}`, { accessToken })
}

/**
 * Create a new group. The caller becomes the owner and first member.
 *
 * @param {string} accessToken
 * @param {{ name: string, description?: string }} payload
 * @returns {Promise<GroupResponse>}
 */
export function createGroup(accessToken, payload) {
  return request('POST', `${BASE}/`, { accessToken, body: payload })
}

/**
 * Update a group's name and/or description. Any active member may update.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @param {{ name: string, description?: string }} payload
 * @returns {Promise<GroupResponse>}
 */
export function updateGroup(accessToken, groupId, payload) {
  return request('PUT', `${BASE}/${groupId}`, { accessToken, body: payload })
}

/**
 * Delete a group and all its data. Only the owner may delete.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @returns {Promise<unknown>}
 */
export function deleteGroup(accessToken, groupId) {
  return request('DELETE', `${BASE}/${groupId}`, { accessToken })
}

// --- Members ---------------------------------------------------------------

/**
 * List active members of a group. Caller must be an active member.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @returns {Promise<Array<GroupMemberResponse>>}
 */
export function listMembers(accessToken, groupId) {
  return request('GET', `${BASE}/${groupId}/members`, { accessToken })
}

/**
 * Add a user to the group by id. If the user previously left or was
 * removed, the backend creates a new active row (re-join).
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<GroupMemberResponse>}
 */
export function addMember(accessToken, groupId, userId) {
  return request('POST', `${BASE}/${groupId}/members`, {
    accessToken,
    body: { userId },
  })
}

/**
 * Remove a member from the group. Any active member may remove any other
 * active member. The UI hides the action against the owner row to honor
 * the single-owner invariant (the backend currently does NOT enforce this
 * — see TODO in `documents/changelog.md`).
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @param {string} userId
 * @returns {Promise<unknown>}
 */
export function removeMember(accessToken, groupId, userId) {
  return request('DELETE', `${BASE}/${groupId}/members/${userId}`, {
    accessToken,
  })
}

/**
 * Leave a group. Only non-owner members may leave; owners must delete
 * the group instead.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @returns {Promise<unknown>}
 */
export function leaveGroup(accessToken, groupId) {
  return request('POST', `${BASE}/${groupId}/leave`, { accessToken })
}

// --- Settings --------------------------------------------------------------

/**
 * Setting keys the frontend knows how to render today.
 *
 * Intentionally empty for now — group-settings UI lands one key at a
 * time as preferences are designed. The backend may expose more keys
 * (`pickKnownGroupSettings()` will drop them) without breaking the UI.
 *
 * @type {Set<string>}
 */
export const KNOWN_GROUP_SETTING_KEYS = new Set()

/**
 * Filter a `GroupSettingsResponse` down to the keys the frontend renders.
 * Tolerates a missing / malformed `settings` array (returns `[]`).
 *
 * @param {{ settings?: Array<{ key: string }> } | null | undefined} response
 * @returns {Array<object>}
 */
export function pickKnownGroupSettings(response) {
  const list = response && Array.isArray(response.settings) ? response.settings : []
  return list.filter((s) => s && KNOWN_GROUP_SETTING_KEYS.has(s.key))
}

/**
 * Get every setting for a group. Every known key is always returned by
 * the backend; unset keys carry their declared defaults. Caller must be
 * an active member.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @returns {Promise<{
 *   groupId: string,
 *   settings: Array<{
 *     key: string,
 *     value: string,
 *     defaultValue: string,
 *     valueType: 'BOOLEAN'|'INTEGER'|'DECIMAL'|'STRING'|'ENUM',
 *     allowedValues: string[],
 *   }>,
 * }>}
 */
export function getGroupSettings(accessToken, groupId) {
  return request('GET', `${BASE}/${groupId}/settings`, { accessToken })
}

/**
 * Partially update group settings. Only provided keys are written.
 * Returns the full updated settings.
 *
 * @param {string} accessToken
 * @param {string} groupId
 * @param {Record<string, string>} settings
 * @returns {Promise<object>}
 */
export function updateGroupSettings(accessToken, groupId, settings) {
  return request('PATCH', `${BASE}/${groupId}/settings`, {
    accessToken,
    body: { settings },
  })
}

