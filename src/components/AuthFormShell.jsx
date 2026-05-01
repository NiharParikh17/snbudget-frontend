import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

/**
 * AuthFormShell — shared chrome for the Sign in / Sign up pages.
 *
 * Provides the centered card, brand mark, heading, and footer-link slot so
 * the two auth pages stay visually consistent without duplicating Tailwind
 * class soups. (DRY rule from `.github/copilot-instructions.md`.)
 */
function AuthFormShell({ title, subtitle, children, footer }) {
  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <div className="max-w-md mx-auto">
        <div className="flex justify-center">
          <Link
            to="/"
            aria-label="SNBudget home"
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          >
            <Logo />
          </Link>
        </div>

        <header className="mt-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 text-slate-600 dark:text-slate-300">{subtitle}</p>
          ) : null}
        </header>

        <div className="mt-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          {children}
        </div>

        {footer ? (
          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            {footer}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default AuthFormShell

