import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listProducts, getCurrentSubscription } from './subscriptions.js'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('subscriptions API', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('listProducts() GETs /api/subscriptions/products with the bearer token', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([{ id: 'p1' }]))
    const products = await listProducts('tok')
    expect(products).toEqual([{ id: 'p1' }])
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/products$/)
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.credentials).toBe('include')
  })

  it('getCurrentSubscription() GETs /api/subscriptions/me with the bearer token', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', status: 'ACTIVE' }),
    )
    const sub = await getCurrentSubscription('tok')
    expect(sub).toMatchObject({ id: 's1', status: 'ACTIVE' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/me$/)
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('getCurrentSubscription() returns null on 204 No Content', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response(null, { status: 204 }))
    await expect(getCurrentSubscription('tok')).resolves.toBeNull()
  })
})

