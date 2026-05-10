import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GroupDetail from './GroupDetail.jsx'
import * as AuthCtx from '../context/AuthContext.jsx'
import * as groupsApi from '../api/groups.js'

const ME = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const OTHER = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'
const THIRD = 'cccccccc-cccc-4ccc-accc-cccccccccccc'
const GID = '11111111-1111-4111-a111-111111111111'

function mockAuth(overrides = {}) {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    accessToken: 'tok',
    userId: ME,
    subscriptionStatus: 'active',
    ...overrides,
  })
}

function makeGroup(overrides = {}) {
  return {
    id: GID,
    name: 'Roomies',
    description: 'Apartment stuff',
    ownerId: ME,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
    ...overrides,
  }
}

function makeMembers({ owner = ME, others = [OTHER] } = {}) {
  return [
    {
      id: 'm-owner',
      groupId: GID,
      userId: owner,
      role: 'OWNER',
      status: 'ACTIVE',
      joinedAt: '2026-01-15T00:00:00Z',
    },
    ...others.map((u, i) => ({
      id: `m-${i}`,
      groupId: GID,
      userId: u,
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: '2026-02-01T00:00:00Z',
    })),
  ]
}

function stubAllOk({
  group = makeGroup(),
  members = makeMembers(),
  settings = { groupId: GID, settings: [] },
} = {}) {
  vi.spyOn(groupsApi, 'getGroup').mockResolvedValue(group)
  vi.spyOn(groupsApi, 'listMembers').mockResolvedValue(members)
  vi.spyOn(groupsApi, 'getGroupSettings').mockResolvedValue(settings)
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={[`/app/groups/${GID}`]}>
      <Routes>
        <Route path="/app/groups" element={<h1>Groups list</h1>} />
        <Route path="/app/groups/:id" element={<GroupDetail />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('GroupDetail', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('loads details, members, and settings in parallel and shows owner-only Delete', async () => {
    stubAllOk()
    renderPage()
    expect(
      await screen.findByRole('heading', { level: 1, name: /roomies/i }),
    ).toBeInTheDocument()
    // Role line shows Owner.
    expect(screen.getByText(/^Owner$/)).toBeInTheDocument()
    // Owner sees Delete, not Leave.
    expect(
      screen.getByRole('button', { name: /delete group/i }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /leave group/i })).toBeNull()
    expect(
      screen.getByText(/ownership can.?t be transferred/i),
    ).toBeInTheDocument()
    // Members + settings cards rendered.
    expect(screen.getByRole('heading', { name: /^members$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /group settings/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/no group preferences yet/i),
    ).toBeInTheDocument()
  })

  it('non-owner sees Leave (not Delete) and no transfer-ownership hint', async () => {
    stubAllOk({
      group: makeGroup({ ownerId: OTHER }),
      members: makeMembers({ owner: OTHER, others: [ME] }),
    })
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })
    expect(screen.getByRole('button', { name: /leave group/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete group/i })).toBeNull()
    expect(
      screen.queryByText(/ownership can.?t be transferred/i),
    ).toBeNull()
  })

  it('shows an inline error + retry on failed details load', async () => {
    const spy = vi
      .spyOn(groupsApi, 'getGroup')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(makeGroup())
    vi.spyOn(groupsApi, 'listMembers').mockResolvedValue(makeMembers())
    vi.spyOn(groupsApi, 'getGroupSettings').mockResolvedValue({
      groupId: GID,
      settings: [],
    })
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load this group/i,
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(
      await screen.findByRole('heading', { level: 1, name: /roomies/i }),
    ).toBeInTheDocument()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('edits the group via the Edit modal and refreshes the displayed details', async () => {
    const user = userEvent.setup()
    stubAllOk()
    const updateSpy = vi
      .spyOn(groupsApi, 'updateGroup')
      .mockResolvedValue(makeGroup({ name: 'Renamed', description: 'New' }))
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })

    await user.click(screen.getByRole('button', { name: /edit details/i }))
    const dialog = await screen.findByRole('dialog', { name: /edit group details/i })
    const nameInput = within(dialog).getByLabelText(/^name/i)
    await user.clear(nameInput)
    await user.type(nameInput, 'Renamed')
    const descInput = within(dialog).getByLabelText(/^description/i)
    await user.clear(descInput)
    await user.type(descInput, 'New')
    await user.click(within(dialog).getByRole('button', { name: /save changes/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: /renamed/i }),
      ).toBeInTheDocument(),
    )
    expect(updateSpy).toHaveBeenCalledWith('tok', GID, {
      name: 'Renamed',
      description: 'New',
    })
  })

  it('owner deletes the group through the Delete confirm modal and is routed to the list', async () => {
    const user = userEvent.setup()
    stubAllOk()
    const deleteSpy = vi.spyOn(groupsApi, 'deleteGroup').mockResolvedValue()
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })

    await user.click(screen.getByRole('button', { name: /delete group/i }))
    const dialog = await screen.findByRole('dialog', { name: /delete this group/i })
    await user.click(
      within(dialog).getByRole('button', { name: /yes, delete group/i }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /groups list/i }),
      ).toBeInTheDocument(),
    )
    expect(deleteSpy).toHaveBeenCalledWith('tok', GID)
  })

  it('non-owner leaves the group through the Leave confirm modal and is routed to the list', async () => {
    const user = userEvent.setup()
    stubAllOk({
      group: makeGroup({ ownerId: OTHER }),
      members: makeMembers({ owner: OTHER, others: [ME] }),
    })
    const leaveSpy = vi.spyOn(groupsApi, 'leaveGroup').mockResolvedValue()
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })

    await user.click(screen.getByRole('button', { name: /leave group/i }))
    const dialog = await screen.findByRole('dialog', { name: /leave this group/i })
    await user.click(
      within(dialog).getByRole('button', { name: /yes, leave group/i }),
    )

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /groups list/i }),
      ).toBeInTheDocument(),
    )
    expect(leaveSpy).toHaveBeenCalledWith('tok', GID)
  })

  it('hides the Remove button on the owner row and on the current user row', async () => {
    stubAllOk({
      group: makeGroup({ ownerId: OTHER }),
      members: makeMembers({ owner: OTHER, others: [ME, THIRD] }),
    })
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })
    // Three rows: owner (OTHER), me, third. Only THIRD's row has Remove.
    const removeButtons = await screen.findAllByRole('button', { name: /^remove$/i })
    expect(removeButtons).toHaveLength(1)
  })

  it('rejects an invalid UUID in the Add member modal without calling the API', async () => {
    const user = userEvent.setup()
    stubAllOk()
    const addSpy = vi.spyOn(groupsApi, 'addMember').mockResolvedValue({})
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })

    await user.click(screen.getByRole('button', { name: /add member/i }))
    const dialog = await screen.findByRole('dialog', { name: /add a member/i })
    await user.type(within(dialog).getByLabelText(/^user id/i), 'not-a-uuid')
    fireEvent.submit(dialog.querySelector('form'))
    await waitFor(() =>
      expect(within(dialog).getByText(/valid user id/i)).toBeInTheDocument(),
    )
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('adds a member with a valid UUID and refreshes the members list', async () => {
    const user = userEvent.setup()
    const listSpy = vi
      .spyOn(groupsApi, 'listMembers')
      .mockResolvedValueOnce(makeMembers({ others: [] }))
      .mockResolvedValueOnce(makeMembers({ others: [OTHER] }))
    vi.spyOn(groupsApi, 'getGroup').mockResolvedValue(makeGroup())
    vi.spyOn(groupsApi, 'getGroupSettings').mockResolvedValue({
      groupId: GID,
      settings: [],
    })
    const addSpy = vi.spyOn(groupsApi, 'addMember').mockResolvedValue({
      id: 'm-new',
      userId: OTHER,
      role: 'MEMBER',
      status: 'ACTIVE',
    })
    renderPage()
    await screen.findByRole('heading', { level: 1, name: /roomies/i })

    await user.click(screen.getByRole('button', { name: /add member/i }))
    const dialog = await screen.findByRole('dialog', { name: /add a member/i })
    await user.type(within(dialog).getByLabelText(/^user id/i), OTHER)
    await user.click(within(dialog).getByRole('button', { name: /^add member$/i }))

    await waitFor(() => expect(addSpy).toHaveBeenCalledWith('tok', GID, OTHER))
    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(2))
  })
})

