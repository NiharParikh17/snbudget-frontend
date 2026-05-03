import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getSettings,
  updateSettings,
  pickKnown,
  KNOWN_SETTING_KEYS,
} from './settings.js'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('settings API', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('getSettings() GETs /api/settings/me with the bearer token', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ settings: [{ key: 'THEME', value: 'DARK' }] }),
    )
    const result = await getSettings('tok')
    expect(result).toMatchObject({
      settings: [{ key: 'THEME', value: 'DARK' }],
    })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/settings\/me$/)
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.credentials).toBe('include')
  })

  it('updateSettings() PATCHes /api/settings/me with the partial map', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ settings: [{ key: 'THEME', value: 'DARK' }] }),
    )
    await updateSettings('tok', { THEME: 'DARK' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/settings\/me$/)
    expect(init.method).toBe('PATCH')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(init.body)).toEqual({ settings: { THEME: 'DARK' } })
  })

  it('pickKnown() drops unknown keys and tolerates a missing settings array', () => {
    expect(pickKnown(null)).toEqual([])
    expect(pickKnown({})).toEqual([])
    expect(pickKnown({ settings: null })).toEqual([])
    // KNOWN_SETTING_KEYS starts empty: every backend key is dropped today.
    expect(
      pickKnown({
        settings: [
          { key: 'THEME', value: 'SYSTEM' },
          { key: 'BUDGET_ALERT_THRESHOLD_PERCENTAGE', value: '80' },
        ],
      }),
    ).toEqual([])
  })

  it('pickKnown() includes a key once it is added to the allow-list', () => {
    KNOWN_SETTING_KEYS.add('THEME')
    try {
      const result = pickKnown({
        settings: [
          { key: 'THEME', value: 'DARK' },
          { key: 'UNKNOWN_KEY', value: 'x' },
        ],
      })
      expect(result).toEqual([{ key: 'THEME', value: 'DARK' }])
    } finally {
      KNOWN_SETTING_KEYS.delete('THEME')
    }
  })
})

