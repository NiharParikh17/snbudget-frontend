import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listProducts,
  getCurrentSubscription,
  subscribe,
  cancelSubscription,
  updateAutoRenew,
  requestProductChange,
  cancelScheduledChange,
} from './subscriptions.js'

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

  it('subscribe() POSTs /api/subscriptions/ with productId + autoRenew', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', status: 'ACTIVE' }),
    )
    const result = await subscribe('tok', { productId: 'p-1' })
    expect(result).toMatchObject({ id: 's1', status: 'ACTIVE' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/$/)
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ productId: 'p-1', autoRenew: true })
  })

  it('subscribe() respects an explicit autoRenew=false', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: 's1' }))
    await subscribe('tok', { productId: 'p-life', autoRenew: false })
    const [, init] = globalThis.fetch.mock.calls[0]
    expect(JSON.parse(init.body)).toEqual({
      productId: 'p-life',
      autoRenew: false,
    })
  })

  it('cancelSubscription() DELETEs /api/subscriptions/me with the bearer token', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response(null, { status: 200 }))
    await cancelSubscription('tok')
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/me$/)
    expect(init.method).toBe('DELETE')
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('updateAutoRenew() PATCHes /api/subscriptions/me/auto-renew with the new flag', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ id: 's1', autoRenew: false }),
    )
    const result = await updateAutoRenew('tok', { autoRenew: false })
    expect(result).toMatchObject({ autoRenew: false })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/me\/auto-renew$/)
    expect(init.method).toBe('PATCH')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(JSON.parse(init.body)).toEqual({ autoRenew: false })
  })

  it('requestProductChange() POSTs /api/subscriptions/me/change with the payload', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ id: 'c1', status: 'PENDING' }),
    )
    const result = await requestProductChange('tok', {
      targetProductId: 'p-year',
      effectiveType: 'NEXT_BILLING_CYCLE',
    })
    expect(result).toMatchObject({ id: 'c1', status: 'PENDING' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/me\/change$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({
      targetProductId: 'p-year',
      effectiveType: 'NEXT_BILLING_CYCLE',
    })
  })

  it('cancelScheduledChange() DELETEs /api/subscriptions/me/change', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response(null, { status: 200 }))
    await cancelScheduledChange('tok')
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/subscriptions\/me\/change$/)
    expect(init.method).toBe('DELETE')
    expect(init.headers.Authorization).toBe('Bearer tok')
  })
})
