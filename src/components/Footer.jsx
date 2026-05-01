import { Link } from 'react-router-dom'

const links = [
  { to: '/about', label: 'About' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/terms', label: 'Terms' },
]

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <p>© {year} SNBudget. All rights reserved.</p>

        <nav aria-label="Footer" className="flex items-center gap-4">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="hover:text-indigo-600 dark:hover:text-indigo-300"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}

export default Footer


