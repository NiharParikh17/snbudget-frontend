import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import FormField from '../components/FormField.jsx'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'
import {
  addMember,
  deleteGroup,
  getGroup,
  getGroupSettings,
  leaveGroup,
  listMembers,
  pickKnownGroupSettings,
  removeMember,
  updateGroup,
} from '../api/groups.js'

/**
 * GroupDetail — manage a single group at `/app/groups/:id`.
 *
 * Three independent slices, each with its own load/error/retry:
 *  - Details — name, description, owner, created date. Edit available
 *    to any active member; Delete to the owner only; Leave to non-owners
 *    only (the owner sees a "transfer is not supported, delete instead"
 *    hint per the single-owner-for-life rule in `domain-model.md`).
 *  - Members — list with Add (pasted UUID, format pre-check) and per-row
 *    Remove (hidden against the owner row to honor the single-owner
 *    invariant; backend doesn't yet enforce this — see changelog TODO).
 *  - Settings — runs `getGroupSettings` and surfaces only keys present
 *    in `KNOWN_GROUP_SETTING_KEYS` (currently empty, so this card shows
 *    an empty state today).
 */

// Permissive UUID v1-v8 shape pre-check so users get inline feedback
// instead of a 400 round-trip when they paste something obviously wrong.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const dateFmt = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return dateFmt.format(d)
}

function describeApiError(err, fallback) {
  if (err instanceof ApiError) return err.message || fallback
  return fallback
}

function GroupDetail() {
  const { id: groupId } = useParams()
  const { accessToken, userId } = useAuth()
  const navigate = useNavigate()

  // --- Details slice -----------------------------------------------------
  const [group, setGroup] = useState(null)
  const [groupError, setGroupError] = useState(null)
  const [groupReloadKey, setGroupReloadKey] = useState(0)

  // --- Members slice -----------------------------------------------------
  const [members, setMembers] = useState(null)
  const [membersError, setMembersError] = useState(null)
  const [membersReloadKey, setMembersReloadKey] = useState(0)

  // --- Settings slice ----------------------------------------------------
  const [settings, setSettings] = useState(null)
  const [settingsError, setSettingsError] = useState(null)
  const [settingsReloadKey, setSettingsReloadKey] = useState(0)

  // --- Modal / mutation state -------------------------------------------
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState(null)
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [editing, setEditing] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [leaveOpen, setLeaveOpen] = useState(false)
  const [leaveError, setLeaveError] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [addUserId, setAddUserId] = useState('')
  const [addError, setAddError] = useState(null)
  const [addFieldError, setAddFieldError] = useState(null)
  const [adding, setAdding] = useState(false)

  const [removeTarget, setRemoveTarget] = useState(null) // member object or null
  const [removeError, setRemoveError] = useState(null)
  const [removing, setRemoving] = useState(false)

  // --- Loaders -----------------------------------------------------------
  useEffect(() => {
    if (!accessToken || !groupId) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const g = await getGroup(accessToken, groupId)
        if (cancelled) return
        setGroup(g)
        setGroupError(null)
      } catch (err) {
        if (cancelled) return
        setGroupError(describeApiError(err, 'Could not load this group.'))
        setGroup(false) // sentinel: failed to load (distinct from null=loading)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, groupId, groupReloadKey])

  useEffect(() => {
    if (!accessToken || !groupId) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listMembers(accessToken, groupId)
        if (cancelled) return
        setMembers(Array.isArray(list) ? list : [])
        setMembersError(null)
      } catch (err) {
        if (cancelled) return
        setMembersError(describeApiError(err, 'Could not load members.'))
        setMembers([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, groupId, membersReloadKey])

  useEffect(() => {
    if (!accessToken || !groupId) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const result = await getGroupSettings(accessToken, groupId)
        if (cancelled) return
        setSettings(pickKnownGroupSettings(result))
        setSettingsError(null)
      } catch (err) {
        if (cancelled) return
        setSettingsError(describeApiError(err, 'Could not load group settings.'))
        setSettings([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, groupId, settingsReloadKey])

  // --- Derivations -------------------------------------------------------
  const groupLoading = group === null
  const groupLoaded = group && typeof group === 'object'
  const isOwner = !!groupLoaded && !!userId && group.ownerId === userId

  // --- Mutations ---------------------------------------------------------
  const openEdit = useCallback(() => {
    if (!groupLoaded) return
    setEditName(group.name ?? '')
    setEditDescription(group.description ?? '')
    setEditError(null)
    setEditFieldErrors({})
    setEditOpen(true)
  }, [group, groupLoaded])

  const handleEdit = useCallback(
    async (event) => {
      event.preventDefault()
      if (editing) return
      const name = editName.trim()
      if (!name) {
        setEditFieldErrors({ name: 'Name is required.' })
        return
      }
      setEditing(true)
      setEditError(null)
      setEditFieldErrors({})
      try {
        const updated = await updateGroup(accessToken, groupId, {
          name,
          description: editDescription.trim(),
        })
        setGroup(updated)
        setEditOpen(false)
      } catch (err) {
        if (err instanceof ApiError) {
          setEditError(err.message)
          setEditFieldErrors(err.fieldErrors || {})
        } else {
          setEditError('Could not update the group. Please try again.')
        }
      } finally {
        setEditing(false)
      }
    },
    [accessToken, groupId, editName, editDescription, editing],
  )

  const handleDelete = useCallback(async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteGroup(accessToken, groupId)
      navigate('/app/groups', { replace: true })
    } catch (err) {
      setDeleteError(describeApiError(err, 'Could not delete the group.'))
    } finally {
      setDeleting(false)
    }
  }, [accessToken, groupId, deleting, navigate])

  const handleLeave = useCallback(async () => {
    if (leaving) return
    setLeaving(true)
    setLeaveError(null)
    try {
      await leaveGroup(accessToken, groupId)
      navigate('/app/groups', { replace: true })
    } catch (err) {
      setLeaveError(describeApiError(err, 'Could not leave the group.'))
    } finally {
      setLeaving(false)
    }
  }, [accessToken, groupId, leaving, navigate])

  const handleAdd = useCallback(
    async (event) => {
      event.preventDefault()
      if (adding) return
      const candidate = addUserId.trim()
      if (!UUID_RE.test(candidate)) {
        setAddFieldError(
          'Enter a valid user ID (UUID, e.g. 11111111-1111-4111-a111-111111111111).',
        )
        return
      }
      setAdding(true)
      setAddError(null)
      setAddFieldError(null)
      try {
        await addMember(accessToken, groupId, candidate)
        setAddOpen(false)
        setAddUserId('')
        setMembersReloadKey((k) => k + 1)
      } catch (err) {
        if (err instanceof ApiError) {
          setAddError(err.message)
          if (err.fieldErrors?.userId) setAddFieldError(err.fieldErrors.userId)
        } else {
          setAddError('Could not add the member. Please try again.')
        }
      } finally {
        setAdding(false)
      }
    },
    [accessToken, groupId, addUserId, adding],
  )

  const handleRemove = useCallback(async () => {
    if (!removeTarget || removing) return
    setRemoving(true)
    setRemoveError(null)
    try {
      await removeMember(accessToken, groupId, removeTarget.userId)
      // If the user removed themselves, the API will eject them — fall back
      // to the list page. Otherwise just refresh the members slice.
      if (removeTarget.userId === userId) {
        navigate('/app/groups', { replace: true })
        return
      }
      setRemoveTarget(null)
      setMembersReloadKey((k) => k + 1)
    } catch (err) {
      setRemoveError(describeApiError(err, 'Could not remove the member.'))
    } finally {
      setRemoving(false)
    }
  }, [accessToken, groupId, removeTarget, removing, userId, navigate])

  // --- Render ------------------------------------------------------------
  if (groupLoading) {
    return (
      <section className="px-4 sm:px-6 py-10">
        <div
          data-testid="group-skeleton"
          className="h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"
          aria-busy="true"
          aria-live="polite"
        />
      </section>
    )
  }

  if (!groupLoaded) {
    return (
      <section className="px-4 sm:px-6 py-10 max-w-3xl mx-auto">
        <ErrorBanner
          onRetry={() => {
            setGroup(null)
            setGroupError(null)
            setGroupReloadKey((k) => k + 1)
          }}
        >
          {groupError ?? 'Could not load this group.'}
        </ErrorBanner>
        <div className="mt-4">
          <Button as={Link} to="/app/groups" variant="ghost">
            ← Back to groups
          </Button>
        </div>
      </section>
    )
  }

  const createdOn = formatDate(group.createdAt)

  return (
    <section className="px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            to="/app/groups"
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            ← All groups
          </Link>
        </div>

        {/* --- Details card -------------------------------------------- */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {group.name}
              </h1>
              {group.description ? (
                <p className="mt-2 text-slate-600 dark:text-slate-300">
                  {group.description}
                </p>
              ) : (
                <p className="mt-2 text-slate-400 dark:text-slate-500 italic text-sm">
                  No description.
                </p>
              )}
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                  <dd className="text-slate-800 dark:text-slate-100">
                    {isOwner ? 'Owner' : 'Member'}
                  </dd>
                </div>
                {createdOn ? (
                  <div>
                    <dt className="text-slate-500 dark:text-slate-400">Created</dt>
                    <dd className="text-slate-800 dark:text-slate-100">
                      {createdOn}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={openEdit}>
              Edit details
            </Button>
            {isOwner ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteOpen(true)
                }}
                className="!text-red-700 dark:!text-red-300 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-950/40"
              >
                Delete group
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setLeaveError(null)
                  setLeaveOpen(true)
                }}
                className="!text-red-700 dark:!text-red-300 !border-red-200 dark:!border-red-900 hover:!bg-red-50 dark:hover:!bg-red-950/40"
              >
                Leave group
              </Button>
            )}
          </div>
          {isOwner ? (
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              You&apos;re the owner. Ownership can&apos;t be transferred —
              to step away from this group, delete it.
            </p>
          ) : null}
        </Card>

        {/* --- Members card -------------------------------------------- */}
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Members
            </h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAddUserId('')
                setAddError(null)
                setAddFieldError(null)
                setAddOpen(true)
              }}
            >
              Add member
            </Button>
          </div>

          <div className="mt-4">
            {members === null ? (
              <div
                data-testid="members-skeleton"
                className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
                aria-busy="true"
              />
            ) : membersError ? (
              <ErrorBanner
                onRetry={() => {
                  setMembers(null)
                  setMembersError(null)
                  setMembersReloadKey((k) => k + 1)
                }}
              >
                {membersError}
              </ErrorBanner>
            ) : members.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                No members yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {members.map((m) => {
                  const memberIsOwner = m.role === 'OWNER'
                  const isMe = m.userId === userId
                  return (
                    <li
                      key={m.id ?? m.userId}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-slate-700 dark:text-slate-200 truncate">
                          {m.userId}
                          {isMe ? (
                            <span className="ml-2 not-italic text-violet-600 dark:text-violet-400">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {memberIsOwner ? 'Owner' : 'Member'}
                          {m.joinedAt
                            ? ` · joined ${formatDate(m.joinedAt) ?? ''}`
                            : ''}
                        </p>
                      </div>
                      {/* Hide remove against the owner row to honor the
                          single-owner invariant. Remove is also hidden for
                          the current user — they should use Leave instead
                          (the backend would let either succeed, but Leave
                          is the explicit "I'm out" flow). */}
                      {!memberIsOwner && !isMe ? (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setRemoveError(null)
                            setRemoveTarget(m)
                          }}
                          className="!text-red-700 dark:!text-red-300"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* --- Settings card ------------------------------------------- */}
        <Card>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Group settings
          </h2>
          {settings === null ? (
            <div
              data-testid="group-settings-skeleton"
              className="mt-4 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
              aria-busy="true"
            />
          ) : settingsError ? (
            <div className="mt-4">
              <ErrorBanner
                onRetry={() => {
                  setSettings(null)
                  setSettingsError(null)
                  setSettingsReloadKey((k) => k + 1)
                }}
              >
                {settingsError}
              </ErrorBanner>
            </div>
          ) : settings.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              No group preferences yet — controls will appear here as we
              add them.
            </p>
          ) : (
            // The frontend allow-list (`KNOWN_GROUP_SETTING_KEYS`) is
            // empty today; this branch only runs once per-key UI lands.
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              {settings.length} preference
              {settings.length === 1 ? '' : 's'} loaded.
            </p>
          )}
        </Card>
      </div>

      {/* --- Edit modal ---------------------------------------------- */}
      <Modal
        open={editOpen}
        onClose={() => {
          if (editing) return
          setEditOpen(false)
        }}
        title="Edit group details"
        size="md"
        closeOnEscape={!editing}
        closeOnBackdrop={!editing}
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <FormField
            label="Name"
            name="edit-group-name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            maxLength={100}
            error={editFieldErrors.name}
          />
          <FormField
            label="Description"
            name="edit-group-description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            maxLength={500}
            error={editFieldErrors.description}
            helpText="Optional. Up to 500 characters."
          />
          {editError ? <ErrorBanner>{editError}</ErrorBanner> : null}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditOpen(false)}
              disabled={editing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={editing}>
              {editing ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Delete confirm modal ------------------------------------ */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          if (deleting) return
          setDeleteOpen(false)
        }}
        title="Delete this group?"
        size="md"
        closeOnEscape={!deleting}
        closeOnBackdrop={!deleting}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Deleting <strong>{group.name}</strong> permanently removes the
          group and all of its data, including its members and settings.
          This cannot be undone.
        </p>
        {deleteError ? (
          <div className="mt-4">
            <ErrorBanner>{deleteError}</ErrorBanner>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Keep group
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="!bg-red-600 hover:!bg-red-500 active:!bg-red-700"
          >
            {deleting ? 'Deleting…' : 'Yes, delete group'}
          </Button>
        </div>
      </Modal>

      {/* --- Leave confirm modal ------------------------------------- */}
      <Modal
        open={leaveOpen}
        onClose={() => {
          if (leaving) return
          setLeaveOpen(false)
        }}
        title="Leave this group?"
        size="md"
        closeOnEscape={!leaving}
        closeOnBackdrop={!leaving}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You&apos;ll lose access to <strong>{group.name}</strong> and any
          of its shared expenses. You can be re-added later by another
          member.
        </p>
        {leaveError ? (
          <div className="mt-4">
            <ErrorBanner>{leaveError}</ErrorBanner>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setLeaveOpen(false)}
            disabled={leaving}
          >
            Stay in group
          </Button>
          <Button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="!bg-red-600 hover:!bg-red-500 active:!bg-red-700"
          >
            {leaving ? 'Leaving…' : 'Yes, leave group'}
          </Button>
        </div>
      </Modal>

      {/* --- Add member modal --------------------------------------- */}
      <Modal
        open={addOpen}
        onClose={() => {
          if (adding) return
          setAddOpen(false)
        }}
        title="Add a member"
        size="md"
        closeOnEscape={!adding}
        closeOnBackdrop={!adding}
      >
        <form onSubmit={handleAdd} className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Paste the user&apos;s ID below. A friend-search by email or
            handle is on the way; for now we only accept user IDs.
          </p>
          <FormField
            label="User ID"
            name="add-user-id"
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
            required
            error={addFieldError}
            placeholder="11111111-1111-4111-a111-111111111111"
            helpText="UUID format."
            autoComplete="off"
          />
          {addError ? <ErrorBanner>{addError}</ErrorBanner> : null}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setAddOpen(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={adding}>
              {adding ? 'Adding…' : 'Add member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Remove member confirm ---------------------------------- */}
      <Modal
        open={removeTarget !== null}
        onClose={() => {
          if (removing) return
          setRemoveTarget(null)
        }}
        title="Remove this member?"
        size="md"
        closeOnEscape={!removing}
        closeOnBackdrop={!removing}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Remove this member from <strong>{group.name}</strong>? They will
          lose access to the group. They can be added back later.
        </p>
        {removeTarget ? (
          <p className="mt-2 font-mono text-xs text-slate-600 dark:text-slate-300 break-all">
            {removeTarget.userId}
          </p>
        ) : null}
        {removeError ? (
          <div className="mt-4">
            <ErrorBanner>{removeError}</ErrorBanner>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3 justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRemoveTarget(null)}
            disabled={removing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            className="!bg-red-600 hover:!bg-red-500 active:!bg-red-700"
          >
            {removing ? 'Removing…' : 'Yes, remove'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}

export default GroupDetail

