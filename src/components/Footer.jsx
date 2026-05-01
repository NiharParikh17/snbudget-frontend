import { Link } from 'react-router-dom'
import Logo from './Logo.jsx'

const links = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" aria-label="SNBudget home" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
          <Logo />
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <nav aria-label="Footer" className="flex items-center gap-5 text-sm text-slate-500 dark:text-slate-400">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-150"
              >
                {label}
              </Link>
            ))}
          </nav>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            © {year} SNBudget
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
