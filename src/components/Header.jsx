import { Link } from 'react-router-dom'
import Button from './Button.jsx'

function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight text-indigo-600 dark:text-indigo-300"
        >
          SNBudget
        </Link>

        <nav aria-label="Account" className="flex items-center gap-2">
          <Button as={Link} to="/signin" variant="ghost">
            Sign in
          </Button>
          <Button as={Link} to="/signup" variant="primary">
            Sign up
          </Button>
        </nav>
      </div>
    </header>
  )
}

export default Header


