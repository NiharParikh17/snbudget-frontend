import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'

/**
 * Privacy page — public, unauthenticated.
 *
 * IMPORTANT (for future contributors / AI assistants):
 *   This page describes how SNBudget handles user data. It is part of the
 *   public contract with users. Whenever data collection, storage, sharing,
 *   retention, security posture, or auth model changes, you MUST update the
 *   matching section below. See `.github/copilot-instructions.md` (step 3b).
 *
 *   This is a pre-launch, plain-English statement of intent — NOT a finalized
 *   legal privacy policy. Once a backend ships and a real policy is drafted,
 *   replace this content (and update the "Last updated" date).
 */

const lastUpdated = 'May 2026'

const principles = [
  {
    title: 'Data minimization',
    body: 'We only collect what we need to make budgeting and splitting work — not analytics dossiers about you.',
  },
  {
    title: 'You own your data',
    body: 'Your transactions, budgets, and splits belong to you. Export and account deletion will be first-class features, not buried support requests.',
  },
  {
    title: 'No selling, no ad targeting',
    body: 'SNBudget will never sell your financial data, share it with advertisers, or use it to target ads.',
  },
  {
    title: 'Transparent third parties',
    body: 'Any third-party processor we add (hosting, email, error reporting) will be listed here with what it sees and why.',
  },
]

function Privacy() {
  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <article className="max-w-3xl mx-auto">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Privacy
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your money. Your data.
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            SNBudget is being built around the idea that financial data is
            sensitive by default. This page is a plain-English statement of
            how we intend to handle your data. It will be replaced by a
            formal privacy policy once the product launches a backend.
          </p>
        </header>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Our principles
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <li
                key={p.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {p.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What we collect today
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is currently a frontend-only preview. There is no
            backend, no account system, and no analytics. The site does not
            set tracking cookies. Nothing you do on this page leaves your
            browser.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What we will collect once accounts exist
          </h2>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>
              <strong>Account info:</strong> email and a display name, plus a
              securely hashed password (or an OAuth identifier if you sign in
              with a provider).
            </li>
            <li>
              <strong>Budget data:</strong> categories, budgets, transactions,
              and splits you create. This is the data you came here to manage.
            </li>
            <li>
              <strong>Sharing data:</strong> when you split an expense with
              another SNBudget user, that user sees the split details
              (amount, description, date, your share / their share). They do
              not see the rest of your budget.
            </li>
            <li>
              <strong>Operational logs:</strong> minimal request and error
              logs needed to keep the service running and debug problems.
              Retained for the shortest practical time.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What we do <em>not</em> collect
          </h2>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>Bank or credit-card credentials. SNBudget has no Plaid-style integration.</li>
            <li>Your contacts, location, or device identifiers.</li>
            <li>Any data we don't directly need to run a feature you're using.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Sharing
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            We do not sell your data. We do not share it with advertisers.
            Data is shared only:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>With other users you explicitly include in a split.</li>
            <li>
              With service providers strictly necessary to operate the
              product (e.g. cloud hosting), under contracts that bind them to
              the same standards.
            </li>
            <li>If required by law, and only to the minimum extent required.</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Your controls
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Once accounts exist, you will be able to:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>Export all of your data in a machine-readable format.</li>
            <li>Delete your account and have your data permanently removed.</li>
            <li>Leave a shared split (your historical share remains visible to other participants for their own records).</li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Security
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Data in transit will be protected with TLS. Passwords will be
            stored using a modern password-hashing algorithm. Access to
            production data will be limited and logged. No system is
            perfectly secure — if we ever discover a breach affecting your
            data, we will notify you promptly.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Changes to this page
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            We will update this page as the product evolves and bump the
            "Last updated" date at the top. Material changes will be called
            out in the app and in the project changelog.
          </p>
        </section>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button as={Link} to="/terms" variant="secondary">
            Read the Terms
          </Button>
          <Button as={Link} to="/" variant="primary">
            Back to home
          </Button>
        </div>
      </article>
    </div>
  )
}

export default Privacy

