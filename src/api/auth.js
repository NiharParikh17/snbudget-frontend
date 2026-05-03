/**
 * Wrappers for the `/api/auth/*` endpoints of the SNBudget Identity API.
 * See the OpenAPI spec for the request/response shapes.
 */
import { request } from '../lib/apiClient.js'

/**
 * @param {{ identifier: string, password: string }} credentials
 * @returns {Promise<{ accessToken: string, tokenType: string, expiresIn: number, userId: string }>}
 */
export function login(credentials) {
  return request('POST', '/api/identity/auth/login', { body: credentials })
}

/** Rotate the refresh cookie for a fresh access token. No Bearer needed. */
export function refresh() {
  return request('POST', '/api/identity/auth/refresh')
}

/** Revoke all tokens. Requires the current access token. */
export function logout(accessToken) {
  return request('POST', '/api/identity/auth/logout', { accessToken })
}

