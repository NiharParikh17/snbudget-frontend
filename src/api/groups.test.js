import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  listMyGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  listMembers,
  addMember,
  removeMember,
  leaveGroup,
  getGroupSettings,
  updateGroupSettings,
  pickKnownGroupSettings,
  KNOWN_GROUP_SETTING_KEYS,
} from './groups.js'

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

const GID = '11111111-1111-1111-1111-111111111111'
const UID = '22222222-2222-2222-2222-222222222222'

describe('groups API', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  it('listMyGroups() GETs /api/groups/me with the bearer token', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([{ id: GID, name: 'Roomies' }]))
    const result = await listMyGroups('tok')
    expect(result).toEqual([{ id: GID, name: 'Roomies' }])
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/groups\/me$/)
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok')
    expect(init.credentials).toBe('include')
  })

  it('getGroup() GETs /api/groups/{id}', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: GID }))
    await getGroup('tok', GID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}$`))
    expect(init.method).toBe('GET')
  })

  it('createGroup() POSTs /api/groups with the payload', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: GID, name: 'Trip' }))
    await createGroup('tok', { name: 'Trip', description: 'Beach' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/groups\/$/)
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ name: 'Trip', description: 'Beach' })
  })

  it('updateGroup() PUTs /api/groups/{id} with the payload', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: GID, name: 'Renamed' }))
    await updateGroup('tok', GID, { name: 'Renamed', description: '' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}$`))
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ name: 'Renamed', description: '' })
  })

  it('deleteGroup() DELETEs /api/groups/{id}', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    await deleteGroup('tok', GID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}$`))
    expect(init.method).toBe('DELETE')
  })

  it('listMembers() GETs /api/groups/{id}/members', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse([]))
    await listMembers('tok', GID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/members$`))
    expect(init.method).toBe('GET')
  })

  it('addMember() POSTs /api/groups/{id}/members with the userId', async () => {
    globalThis.fetch.mockResolvedValueOnce(jsonResponse({ id: 'm1', userId: UID }))
    await addMember('tok', GID, UID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/members$`))
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body)).toEqual({ userId: UID })
  })

  it('removeMember() DELETEs /api/groups/{id}/members/{userId}', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    await removeMember('tok', GID, UID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/members/${UID}$`))
    expect(init.method).toBe('DELETE')
  })

  it('leaveGroup() POSTs /api/groups/{id}/leave', async () => {
    globalThis.fetch.mockResolvedValueOnce(new Response('', { status: 200 }))
    await leaveGroup('tok', GID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/leave$`))
    expect(init.method).toBe('POST')
  })

  it('getGroupSettings() GETs /api/groups/{id}/settings', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ groupId: GID, settings: [] }),
    )
    await getGroupSettings('tok', GID)
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/settings$`))
    expect(init.method).toBe('GET')
  })

  it('updateGroupSettings() PATCHes /api/groups/{id}/settings with the partial', async () => {
    globalThis.fetch.mockResolvedValueOnce(
      jsonResponse({ groupId: GID, settings: [] }),
    )
    await updateGroupSettings('tok', GID, { THEME: 'DARK' })
    const [url, init] = globalThis.fetch.mock.calls[0]
    expect(url).toMatch(new RegExp(`/api/groups/${GID}/settings$`))
    expect(init.method).toBe('PATCH')
    expect(JSON.parse(init.body)).toEqual({ settings: { THEME: 'DARK' } })
  })

  it('pickKnownGroupSettings() drops unknown keys and tolerates missing arrays', () => {
    expect(pickKnownGroupSettings(null)).toEqual([])
    expect(pickKnownGroupSettings({})).toEqual([])
    expect(pickKnownGroupSettings({ settings: null })).toEqual([])
    expect(
      pickKnownGroupSettings({
        settings: [{ key: 'WHATEVER', value: 'x' }],
      }),
    ).toEqual([])
  })

  it('pickKnownGroupSettings() includes a key once it is added to the allow-list', () => {
    KNOWN_GROUP_SETTING_KEYS.add('CURRENCY')
    try {
      const result = pickKnownGroupSettings({
        settings: [
          { key: 'CURRENCY', value: 'USD' },
          { key: 'UNKNOWN', value: 'x' },
        ],
      })
      expect(result).toEqual([{ key: 'CURRENCY', value: 'USD' }])
    } finally {
      KNOWN_GROUP_SETTING_KEYS.delete('CURRENCY')
    }
  })
})

