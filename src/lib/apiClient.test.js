import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiError, request, getApiBaseUrl } from './apiClient.js'

function mockFetch(response) {
  globalThis.fetch = vi.fn().mockResolvedValue(response)
}

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('apiClient', () => {
  beforeEach(() => {
    // override the default rejecting stub from setup.js
    globalThis.fetch = vi.fn()
  })

  it('falls back to localhost:8081 when no env var is set', () => {
    expect(getApiBaseUrl()).toMatch(/^https?:\/\//)
  })

  it('always sends credentials: "include"', async () => {
    mockFetch(jsonResponse({ ok: true }))
    await request('GET', '/api/identity/users/abc')
    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.credentials).toBe('include')
  })

  it('serializes the body and sets Content-Type for JSON requests', async () => {
    mockFetch(jsonResponse({ ok: true }))
    await request('POST', '/api/identity/auth/login', { body: { identifier: 'x', password: 'y' } })
    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ identifier: 'x', password: 'y' })
  })

  it('attaches the bearer token when provided', async () => {
    mockFetch(jsonResponse({ ok: true }))
    await request('POST', '/api/identity/auth/logout', { accessToken: 'tok' })
    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('omits Authorization when no token is provided', async () => {
    mockFetch(jsonResponse({ ok: true }))
    await request('POST', '/api/identity/auth/refresh')
    const [, init] = globalThis.fetch.mock.calls[0]
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('throws ApiError with the server-provided message on non-2xx', async () => {
    mockFetch(jsonResponse({ message: 'Email not verified' }, { status: 401 }))
    await expect(request('POST', '/api/identity/auth/login', { body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Email not verified',
    })
  })

  it('surfaces fieldErrors from the server', async () => {
    mockFetch(
      jsonResponse(
        { message: 'Validation failed', fieldErrors: { email: 'taken' } },
        { status: 400 },
      ),
    )
    try {
      await request('POST', '/api/identity/users', { body: {} })
      throw new Error('expected ApiError')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect(err.fieldErrors).toEqual({ email: 'taken' })
    }
  })

  it('wraps network failures in an ApiError with status 0', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(request('GET', '/api/identity/users/abc')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    })
  })
})

