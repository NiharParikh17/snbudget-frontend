import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import RequireAuth from './RequireAuth.jsx'
import RequireSubscription from './RequireSubscription.jsx'
import Sidebar from './Sidebar.jsx'

/**
 * AppShell — layout wrapper for every authenticated `/app/*` route.
 *
 * Composes the auth + subscription guards, then renders the left
 * `Sidebar` next to the routed page (`<Outlet/>`). On mobile the
 * sidebar is hidden; a small toggle button opens it as a slide-over
 * with a backdrop (ESC / backdrop click closes).
 *
 * The `Header` and `Footer` continue to wrap the whole app via
 * `Layout`, so this component is intentionally just the inner two-pane
 * layout.
 */
function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  function close() {
    setMobileOpen(false)
  }

  return (
    <RequireAuth>
      <RequireSubscription>
        <div className="flex min-h-[calc(100vh-8rem)]">
          <Sidebar />

          <div className="flex flex-1 flex-col">
            {/* Mobile-only toggle row */}
            <div className="md:hidden border-b border-slate-200 dark:border-slate-800 px-4 py-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
                aria-controls="app-mobile-nav"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 5.75A.75.75 0 013.75 5h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 5.75zm0 4.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm.75 3.5a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H3.75z"
                    clipRule="evenodd"
                  />
                </svg>
                Menu
              </button>
            </div>

            <main className="flex-1">
              <Outlet />
            </main>
          </div>

          {/* Mobile slide-over */}
          {mobileOpen ? (
            <div
              id="app-mobile-nav"
              className="fixed inset-0 z-40 md:hidden"
              role="presentation"
            >
              <button
                type="button"
                aria-label="Close navigation"
                onClick={close}
                className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-sm cursor-default"
              />
              <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl">
                <Sidebar mobile onNavigate={close} />
              </div>
            </div>
          ) : null}
        </div>
      </RequireSubscription>
    </RequireAuth>
  )
}

export default AppShell

