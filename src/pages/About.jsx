import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'

/**
 * About page — public, unauthenticated.
 *
 * IMPORTANT (for future contributors / AI assistants):
 *   This page is the user-facing summary of what SNBudget is and does.
 *   Whenever you change product scope (features added, removed, renamed),
 *   the domain model, the auth model, or the roadmap, you MUST update the
 *   matching section below so this page never goes stale. See
 *   `.github/copilot-instructions.md` and `documents/product-overview.md`.
 */

const featurePillars = [
  {
    title: 'Personal budgeting',
    body: 'Create categories (groceries, rent, fun, …), set monthly limits, and track real-time progress against them.',
  },
  {
    title: 'Transactions',
    body: 'Log expenses and income against a category — manually today, with CSV import planned.',
  },
  {
    title: 'Built-in expense splitting',
    body: 'Split any transaction with other SNBudget users by equal shares, custom shares, percent, or exact amounts.',
  },
  {
    title: 'Auto-balanced budgets',
    body: "Each participant's share of a split posts as a transaction in their own budget — no double bookkeeping.",
  },
  {
    title: 'Balances & settle up',
    body: 'See a running "who owes whom" view across every shared expense, and settle up when you\'re ready.',
  },
  {
    title: 'Insights (planned)',
    body: 'Trends and summaries to understand where your money actually goes over time.',
  },
]

const nonGoals = [
  'Direct bank or credit-card integrations (Plaid, etc.) — manual or CSV only at first.',
  'Multi-currency conversion. One currency per user to start.',
  'Native mobile apps. Web-first; mobile wrappers can come later.',
]

function About() {
  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <article className="max-w-3xl mx-auto">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            About SNBudget
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            One app for your budget <span className="whitespace-nowrap">and</span> your splits.
          </h1>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            SNBudget is a personal budgeting app with built-in expense
            splitting between users. Think of it as a budgeting tool fused
            with the social-payments model of Splitwise — your share of any
            shared expense flows straight back into your own budget.
          </p>
        </header>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Who it&apos;s for
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Anyone who wants category-based budgets, especially people who
            also routinely share costs — roommates, couples, friend groups,
            and travel companions. Today most people juggle a budgeting app
            <em> and </em> a separate splitting app, then reconcile the two
            by hand. SNBudget removes that reconciliation step.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What you can do
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {featurePillars.map((pillar) => (
              <li
                key={pillar.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            How it works
          </h2>
          <ol className="mt-3 space-y-2 list-decimal list-inside text-slate-600 dark:text-slate-300">
            <li>Create your categories and set a monthly budget for each.</li>
            <li>Log transactions as expenses or income against a category.</li>
            <li>
              For shared costs, create a <strong>split</strong> and pick the
              participants and method (equal, shares, percent, or exact).
            </li>
            <li>
              SNBudget posts each participant&apos;s share to their own
              budget automatically and updates the running balance between
              you.
            </li>
            <li>Settle up whenever you like.</li>
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Where we are today
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is in early development. The web frontend currently
            ships the public landing pages (Home, About, Privacy, Terms)
            plus the first authenticated flows: <strong>Sign up</strong>
            and <strong>Sign in</strong>, backed by the SNBudget Identity
            API. New accounts must verify their email address (via a link
            we email you) before they can sign in. After signing in,
            users are asked to <strong>choose a subscription plan</strong>
            and are enrolled immediately on the backend — no payment is
            collected yet (checkout will be added before billing goes
            live). A <strong>Settings page</strong> lets you review your
            plan, change to a different plan at the next billing cycle,
            and cancel your subscription. <strong>Group management</strong>
            is also live: create groups, edit or delete your own groups,
            add and remove members, and leave groups you don&apos;t own.
            Splits, balances, and the budgeting features are next; see
            the{' '}
            <Link
              to="/"
              className="text-violet-600 dark:text-violet-400 underline"
            >
              roadmap on the project site
            </Link>{' '}
            for the latest.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What it deliberately won&apos;t do (yet)
          </h2>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            {nonGoals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Privacy &amp; your data
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is being built with the assumption that financial data
            is sensitive. Data minimization, clear ownership, and an
            export-anytime stance are baseline goals. See the{' '}
            <Link
              to="/privacy"
              className="text-violet-600 dark:text-violet-400 underline"
            >
              Privacy page
            </Link>{' '}
            for the current statement of intent, and the{' '}
            <Link
              to="/terms"
              className="text-violet-600 dark:text-violet-400 underline"
            >
              Terms
            </Link>{' '}
            for the rules of the road.
          </p>
        </section>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button as={Link} to="/signup" variant="primary">
            Create your account
          </Button>
          <Button as={Link} to="/" variant="secondary">
            Back to home
          </Button>
        </div>
      </article>
    </div>
  )
}

export default About

