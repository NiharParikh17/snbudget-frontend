import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'

const features = [
  {
    title: 'Track every dollar',
    body: 'Set monthly budgets per category and watch spending in real time.',
  },
  {
    title: 'Split with friends',
    body: 'Share expenses with roommates, partners, or trip mates — equal, by share, percent, or exact amounts.',
  },
  {
    title: 'Auto-balanced budgets',
    body: "Your share of any split posts straight to your own budget. No double bookkeeping.",
  },
]

function Home() {
  return (
    <>
      <section className="px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Budget smarter.{' '}
            <span className="text-indigo-600 dark:text-indigo-300">
              Split easier.
            </span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            SNBudget combines personal budgeting with built-in expense
            splitting, so shared costs stay in sync with your own budget —
            automatically.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Button as={Link} to="/signup" variant="primary">
              Get started
            </Button>
            <Button as={Link} to="/signin" variant="secondary">
              I already have an account
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-label="Features"
        className="px-4 sm:px-6 pb-20"
      >
        <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
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



