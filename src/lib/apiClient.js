/**
 * Tiny `fetch` wrapper for the SNBudget Identity API.
 *
 * Security notes:
 *   - Always sends `credentials: 'include'` so the HttpOnly refresh cookie
 *     issued by the backend is sent on every call. The dev backend MUST set
 *     `Access-Control-Allow-Credentials: true` and an explicit
 *     `Access-Control-Allow-Origin` (not `*`) for this to work cross-origin.
 *   - The access token is held in memory (see AuthContext) and only attached
 *     to requests that opt in via `accessToken`. It is never persisted to
 *     localStorage / sessionStorage and never logged.
 *   - On non-2xx responses the body is parsed best-effort and re-thrown as
 *     an `ApiError` carrying `status`, `message`, and any `fieldErrors`.
 */

const DEFAULT_BASE_URL = 'http://localhost:8080'

export function getApiBaseUrl() {
  // import.meta.env is statically replaced by Vite. Guard for non-Vite
  // environments (e.g. some test setups) so this stays robust.
  const fromEnv =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL
  return (fromEnv || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

export class ApiError extends Error {
  constructor({ status, message, fieldErrors }) {
    super(message || `Request failed with status ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors || {}
  }
}

async function parseBody(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Perform an HTTP request against the API.
 *
 * @param {'GET'|'POST'|'PUT'|'DELETE'} method
 * @param {string} path  Path beginning with `/`, e.g. `/api/identity/auth/login`.
 * @param {{ body?: unknown, accessToken?: string|null, signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown>} parsed JSON body or null
 */
export async function request(method, path, opts = {}) {
  const { body, accessToken, signal } = opts
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  let response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch {
    // Network / CORS failure
    throw new ApiError({
      status: 0,
      message: 'Could not reach the SNBudget service. Please try again.',
    })
  }

  const payload = await parseBody(response)

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with status ${response.status}`
    const fieldErrors =
      (payload && typeof payload === 'object' && payload.fieldErrors) || {}
    throw new ApiError({ status: response.status, message, fieldErrors })
  }

  return payload
}


