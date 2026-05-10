import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import Modal from '../components/Modal.jsx'
import FormField from '../components/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { ApiError } from '../lib/apiClient.js'
import { createGroup, listMyGroups } from '../api/groups.js'

/**
 * Groups — list of every group the signed-in user is an active member of,
 * plus a Create group dialog. The detail / management surface lives at
 * `/app/groups/:id` (`pages/GroupDetail.jsx`).
 *
 * UX:
 *  - Loads the list lazily; each row is a card-link to the detail page.
 *  - "Owner" badge when `group.ownerId === useAuth().userId`. Ownership
 *    is fixed for the lifetime of a group (no transfer / co-owners) — see
 *    `documents/domain-model.md`.
 *  - Create group opens a `Modal` so the page doesn't shove around. On
 *    success we navigate straight into the new group's detail page.
 */

function Groups() {
  const { accessToken, userId } = useAuth()
  const navigate = useNavigate()

  const [groups, setGroups] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createError, setCreateError] = useState(null)
  const [createFieldErrors, setCreateFieldErrors] = useState({})
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!accessToken) return undefined
    let cancelled = false
    ;(async () => {
      try {
        const list = await listMyGroups(accessToken)
        if (cancelled) return
        setGroups(Array.isArray(list) ? list : [])
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof ApiError
            ? err.message
            : 'Could not load your groups. Please try again.',
        )
        setGroups([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [accessToken, reloadKey])

  const resetCreateForm = useCallback(() => {
    setCreateName('')
    setCreateDescription('')
    setCreateError(null)
    setCreateFieldErrors({})
  }, [])

  const handleCreate = useCallback(
    async (event) => {
      event.preventDefault()
      if (creating) return
      const name = createName.trim()
      if (!name) {
        setCreateFieldErrors({ name: 'Name is required.' })
        return
      }
      setCreating(true)
      setCreateError(null)
      setCreateFieldErrors({})
      try {
        const created = await createGroup(accessToken, {
          name,
          description: createDescription.trim(),
        })
        setCreateOpen(false)
        resetCreateForm()
        // Bump the list so the new group appears if the user navigates back.
        setReloadKey((k) => k + 1)
        if (created?.id) navigate(`/app/groups/${created.id}`)
      } catch (err) {
        if (err instanceof ApiError) {
          setCreateError(err.message)
          setCreateFieldErrors(err.fieldErrors || {})
        } else {
          setCreateError('Could not create the group. Please try again.')
        }
      } finally {
        setCreating(false)
      }
    },
    [accessToken, createName, createDescription, creating, navigate, resetCreateForm],
  )

  const loading = groups === null

  return (
    <section className="px-4 sm:px-6 py-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Groups
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your groups
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-2xl">
            Groups are how you organize people you share expenses with.
            Create one for roommates, a trip, or any recurring split.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          New group
        </Button>
      </header>

      <div className="mt-8">
        {loading ? (
          <div
            data-testid="groups-skeleton"
            className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse"
            aria-busy="true"
            aria-live="polite"
          />
        ) : error ? (
          <ErrorBanner
            onRetry={() => {
              setGroups(null)
              setError(null)
              setReloadKey((k) => k + 1)
            }}
          >
            {error}
          </ErrorBanner>
        ) : groups.length === 0 ? (
          <Card>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              No groups yet
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Create your first group to start tracking shared expenses.
            </p>
            <div className="mt-4">
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Create a group
              </Button>
            </div>
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => {
              const isOwner = userId && g.ownerId === userId
              return (
                <li key={g.id}>
                  <Link
                    to={`/app/groups/${g.id}`}
                    className="block h-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {g.name}
                      </h2>
                      {isOwner ? (
                        <span className="inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                          Owner
                        </span>
                      ) : null}
                    </div>
                    {g.description ? (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        {g.description}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400 dark:text-slate-500 italic">
                        No description
                      </p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          if (creating) return
          setCreateOpen(false)
          resetCreateForm()
        }}
        title="Create a new group"
        size="md"
        closeOnEscape={!creating}
        closeOnBackdrop={!creating}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField
            label="Name"
            name="group-name"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            required
            maxLength={100}
            error={createFieldErrors.name}
            placeholder="e.g. Roommates"
          />
          <FormField
            label="Description"
            name="group-description"
            value={createDescription}
            onChange={(e) => setCreateDescription(e.target.value)}
            maxLength={500}
            error={createFieldErrors.description}
            helpText="Optional. Up to 500 characters."
            placeholder="What is this group for?"
          />

          {createError ? <ErrorBanner>{createError}</ErrorBanner> : null}

          <div className="flex flex-wrap gap-3 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreateOpen(false)
                resetCreateForm()
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create group'}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  )
}

export default Groups

