import { Link } from 'react-router-dom'
import Button from '../components/Button.jsx'

/**
 * Terms page — public, unauthenticated.
 *
 * IMPORTANT (for future contributors / AI assistants):
 *   These are pre-launch terms of use written in plain English. They are NOT
 *   a substitute for a lawyer-reviewed Terms of Service. Whenever the product
 *   gains accounts, payments, third-party integrations, or otherwise changes
 *   what users can / can't do or what we promise, you MUST update the
 *   matching section below. See `.github/copilot-instructions.md` (step 3b).
 */

const lastUpdated = 'May 2026'

function Terms() {
  return (
    <div className="px-4 sm:px-6 py-12 sm:py-16">
      <article className="max-w-3xl mx-auto">
        <header className="text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
            Terms
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Terms of use
          </h1>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdated}
          </p>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            By accessing SNBudget, you agree to the terms below. SNBudget is
            in early development; these terms will be replaced by a formal
            Terms of Service before public launch.
          </p>
        </header>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            What SNBudget is
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is a personal budgeting tool with built-in expense
            splitting between users. It is a software service for tracking
            and organizing your own financial information. It is{' '}
            <strong>not</strong> a bank, payment processor, money
            transmitter, or financial advisor, and nothing in the product
            constitutes financial, legal, or tax advice.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Eligibility &amp; accounts
          </h2>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>
              You must be old enough to form a binding contract in your
              jurisdiction (generally 18+).
            </li>
            <li>
              When account sign-up exists, you agree to provide accurate
              information and to keep your credentials secure.
            </li>
            <li>
              You are responsible for activity that happens under your
              account.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Acceptable use
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            You agree not to:
          </p>
          <ul className="mt-3 space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300">
            <li>Use SNBudget to break the law or infringe anyone's rights.</li>
            <li>Attempt to access other users' data without authorization.</li>
            <li>
              Probe, scan, or attack the service, or interfere with other
              users' use of it.
            </li>
            <li>
              Reverse engineer the service except where applicable law
              expressly permits it.
            </li>
            <li>
              Use the service to harass, defraud, or coerce other users —
              including by misrepresenting shared expenses.
            </li>
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Splits between users
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget records what users say they spent and how they choose to
            split it. <strong>It does not move money.</strong> Whether and
            how participants actually settle a balance is between them. If
            you and another user disagree about a split, you'll need to work
            it out directly; SNBudget can show the recorded history but
            cannot adjudicate the underlying transaction.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Your content
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            You retain ownership of the data you put into SNBudget
            (categories, transactions, splits, etc.). You grant SNBudget a
            limited license to store, process, and display that data solely
            to operate the service for you and the people you choose to
            share with.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Service availability &amp; changes
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is provided on an as-is basis. We may add, change, or
            remove features as the product evolves; we'll do our best to
            communicate breaking changes in advance and to preserve data you
            care about. We do not guarantee uninterrupted availability,
            especially during this pre-launch phase.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Disclaimers
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            To the maximum extent permitted by law, SNBudget is provided
            "as is" and "as available," without warranties of any kind,
            express or implied. We do not warrant that the service will be
            error-free, that calculations or balances will be free of bugs,
            or that the service will meet your specific needs. Always verify
            anything that matters financially.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Limitation of liability
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            To the maximum extent permitted by law, SNBudget and its
            contributors will not be liable for any indirect, incidental,
            special, consequential, or punitive damages, or for any loss of
            profits, revenue, data, or goodwill, arising out of your use of
            the service.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Termination
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            You can stop using SNBudget at any time. Once accounts exist,
            you'll also be able to delete your account and your data. We may
            suspend or terminate access if you violate these terms or if we
            need to protect other users or the service.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Changes to these terms
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            We will update this page as the product evolves and bump the
            "Last updated" date at the top. Material changes will be called
            out in the app and in the project changelog. Continued use of
            SNBudget after a change constitutes acceptance of the updated
            terms.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Contact
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            SNBudget is currently a personal project under active
            development. A formal contact channel will be published with the
            backend launch.
          </p>
        </section>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button as={Link} to="/privacy" variant="secondary">
            Read the Privacy notes
          </Button>
          <Button as={Link} to="/" variant="primary">
            Back to home
          </Button>
        </div>
      </article>
    </div>
  )
}

export default Terms

