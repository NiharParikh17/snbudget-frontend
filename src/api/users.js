/**
 * Wrappers for the `/api/identity/users` endpoints of the SNBudget Identity API.
 * Only the public registration endpoint is implemented for now —
 * profile read/update/delete will be added when the dashboard lands.
 */
import { request } from '../lib/apiClient.js'

/**
 * Register a new account. Returns the created `UserResponse`.
 * No token required — this is the public registration endpoint.
 */
export function createUser(payload) {
  return request('POST', '/api/identity/users', { body: payload })
}

