import { NavLink } from 'react-router-dom'
import { PRIMARY_TABS } from './primaryTabs.js'

const BASE_LINK =
  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'

const INACTIVE_LINK =
  'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'

const ACTIVE_LINK =
  'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-200'

/**
 * Sidebar — left-rail primary navigation for the authenticated app shell.
 *
 * Renders only on `md:` and up; on smaller viewports `AppShell` mounts
 * this same component inside a slide-over with `mobile` set to `true`,
 * which surfaces the optional `onNavigate` callback so a tap on a link
 * closes the drawer.
 */
function Sidebar({ mobile = false, onNavigate }) {
  return (
    <nav
      aria-label="Primary"
      className={
        mobile
          ? 'flex w-64 flex-col gap-1 p-4'
          : 'hidden md:flex md:w-60 md:flex-col md:gap-1 md:border-r md:border-slate-200 md:dark:border-slate-800 md:bg-white/60 md:dark:bg-slate-900/40 md:p-4'
      }
    >
      {PRIMARY_TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `${BASE_LINK} ${isActive ? ACTIVE_LINK : INACTIVE_LINK}`
          }
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default Sidebar


