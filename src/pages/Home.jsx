import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'

/* ── SVG icons (inline, no extra dep) ────────────────────────────────── */
function IconWallet() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-violet-500">
      <path d="M21 7H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <path d="M16 3H5a1 1 0 0 0-1 1v3h14V5a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round"/>
      <circle cx="16.5" cy="13" r="1.5" fill="currentColor"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-violet-500">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M3 20c0-3.31 2.686-6 6-6s6 2.69 6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
      <circle cx="18" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.75"/>
      <path d="M21 19c0-2.21-1.567-4-3.5-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
    </svg>
  )
}

function IconSync() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-violet-500">
      <path d="M4 4v5h5M20 20v-5h-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 9m16 6-1.64 3.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const features = [
  {
    icon: <IconWallet />,
    title: 'Track every dollar',
    body: 'Set monthly budgets per category and watch spending in real time.',
  },
  {
    icon: <IconUsers />,
    title: 'Split with friends',
    body: 'Share expenses with roommates, partners, or trip mates — equal, by share, percent, or exact amounts.',
  },
  {
    icon: <IconSync />,
    title: 'Auto-balanced budgets',
    body: "Your share of any split posts straight to your own budget. No double bookkeeping.",
  },
]

const trustPoints = [
  'No bank linking required',
  'Your data stays yours',
  'Free during early access',
]

function Home() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 sm:px-6 py-20 sm:py-32 text-center">
        {/* Gradient blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/20 blur-3xl" />
          <div className="absolute top-16 right-0 w-72 h-72 rounded-full bg-cyan-400/10 dark:bg-cyan-500/10 blur-2xl" />
        </div>

        <div className="max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold uppercase tracking-widest rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
            Early access — free to try
          </span>

          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Budget smarter.{' '}
            <span className="bg-gradient-to-r from-violet-600 to-cyan-500 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent">
              Split easier.
            </span>
          </h1>

          <p className="mt-6 text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            SNBudget combines personal budgeting with built-in expense
            splitting — your share of any shared cost updates your own
            budget automatically, with zero manual reconciliation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button as={Link} to="/signup" variant="primary" className="text-base px-7 py-3">
              Get started free
            </Button>
            <Button as={Link} to="/signin" variant="secondary" className="text-base px-7 py-3">
              Sign in
            </Button>
          </div>

          {/* Trust strip */}
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trustPoints.map((pt) => (
              <li
                key={pt}
                className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <circle cx="7" cy="7" r="7" fill="#7c3aed" fillOpacity=".15"/>
                  <path d="M4 7l2 2 4-4" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section
        aria-label="Features"
        className="px-4 sm:px-6 pb-24"
      >
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200"
            >
              <div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30">
                {f.icon}
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {f.body}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}

export default Home
