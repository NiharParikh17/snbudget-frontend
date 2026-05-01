import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import Logo from './Logo.jsx'

function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg"
          aria-label="SNBudget home"
        >
          <Logo />
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
