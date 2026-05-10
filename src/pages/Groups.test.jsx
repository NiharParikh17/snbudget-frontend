import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Groups from './Groups.jsx'
import * as AuthCtx from '../context/AuthContext.jsx'
import * as groupsApi from '../api/groups.js'

const ME = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
const G1 = '11111111-1111-4111-a111-111111111111'
const G2 = '22222222-2222-4222-a222-222222222222'

function mockAuth(overrides = {}) {
  vi.spyOn(AuthCtx, 'useAuth').mockReturnValue({
    accessToken: 'tok',
    userId: ME,
    subscriptionStatus: 'active',
    ...overrides,
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/groups']}>
      <Routes>
        <Route path="/app/groups" element={<Groups />} />
        <Route path="/app/groups/:id" element={<h1>Detail page</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Groups page', () => {
  beforeEach(() => {
    mockAuth()
  })

  it('shows a loading skeleton then renders the list with an Owner badge for owned groups', async () => {
    vi.spyOn(groupsApi, 'listMyGroups').mockResolvedValue([
      { id: G1, name: 'Roomies', description: 'Shared apartment', ownerId: ME },
      { id: G2, name: 'Trip', description: 'Beach week', ownerId: 'someone-else' },
    ])
    renderPage()
    expect(screen.getByTestId('groups-skeleton')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /roomies/i })).toBeInTheDocument(),
    )
    expect(screen.getByRole('heading', { name: /trip/i })).toBeInTheDocument()
    const ownerBadges = screen.getAllByText(/^owner$/i)
    expect(ownerBadges).toHaveLength(1)
    const links = screen.getAllByRole('link')
    expect(links.some((a) => a.getAttribute('href') === `/app/groups/${G1}`)).toBe(
      true,
    )
  })

  it('renders an empty state with a Create a group CTA when the user has no groups', async () => {
    vi.spyOn(groupsApi, 'listMyGroups').mockResolvedValue([])
    renderPage()
    expect(
      await screen.findByRole('heading', { name: /no groups yet/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /create a group/i }),
    ).toBeInTheDocument()
  })

  it('shows an inline error with retry on failed load and re-fetches on retry', async () => {
    const spy = vi
      .spyOn(groupsApi, 'listMyGroups')
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce([{ id: G1, name: 'Roomies', ownerId: ME }])
    renderPage()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not load your groups/i,
    )
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /roomies/i })).toBeInTheDocument(),
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('opens the Create group modal, submits, and navigates to the new group detail', async () => {
    const user = userEvent.setup()
    vi.spyOn(groupsApi, 'listMyGroups').mockResolvedValue([])
    const createSpy = vi
      .spyOn(groupsApi, 'createGroup')
      .mockResolvedValue({ id: G2, name: 'Trip', ownerId: ME })
    renderPage()
    await screen.findByRole('heading', { name: /no groups yet/i })

    await user.click(screen.getByRole('button', { name: /^new group$/i }))
    await screen.findByRole('dialog')
    await user.type(screen.getByLabelText(/^name/i), 'Trip')
    await user.type(screen.getByLabelText(/^description/i), 'Beach week')
    await user.click(screen.getByRole('button', { name: /^create group$/i }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /detail page/i }),
      ).toBeInTheDocument(),
    )
    expect(createSpy).toHaveBeenCalledWith('tok', {
      name: 'Trip',
      description: 'Beach week',
    })
  })

  it('blocks Create when name is empty (inline field error, no API call)', async () => {
    const user = userEvent.setup()
    vi.spyOn(groupsApi, 'listMyGroups').mockResolvedValue([])
    const createSpy = vi.spyOn(groupsApi, 'createGroup').mockResolvedValue({})
    renderPage()
    await screen.findByRole('heading', { name: /no groups yet/i })

    await user.click(screen.getByRole('button', { name: /^new group$/i }))
    const dialog = await screen.findByRole('dialog')
    const form = dialog.querySelector('form')
    fireEvent.submit(form)
    await waitFor(() =>
      expect(screen.getByText(/name is required/i)).toBeInTheDocument(),
    )
    expect(createSpy).not.toHaveBeenCalled()
  })
})

