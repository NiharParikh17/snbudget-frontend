# Copilot / AI Assistant Instructions for SNBudget Frontend

> **You (the AI assistant) must follow this workflow on every change.**
> The user has explicitly asked that documentation, the README, and tests stay
> in lock-step with the code. Treat this file as a hard requirement, not a
> suggestion.

## Project context

- **App:** SNBudget — a personal budgeting app with built-in expense splitting
  between users (Splitwise-style). A user's split share automatically affects
  their own budget.
- **This repo:** the **web frontend** (React 19 + Vite + Tailwind CSS v4).
- **Source of truth for product/design decisions:** the [`documents/`](../documents/)
  folder. Read it before designing anything non-trivial.

## Required workflow for every change

For **any** non-cosmetic change you make, you must:

### 1. Read the relevant docs first
- Skim `documents/README.md` and any doc that touches the area you're changing
  (e.g. `domain-model.md` for entity changes, `architecture.md` for structural
  changes).

### 2. Update documentation
- If you add, change, or remove a **feature**, update or create the matching
  doc in `documents/`.
- If you change the **domain model**, update `documents/domain-model.md`.
- If you change **structure, tooling, or conventions**, update
  `documents/architecture.md`.
- If a planned roadmap item is started/completed, tick it in
  `documents/roadmap.md`.
- **Always** add an entry under `## [Unreleased]` in
  `documents/changelog.md` describing what changed.

### 3. Update the README
Update `README.md` when any of these change:
- Scripts in `package.json`
- The tech stack (new framework, library category, build tool)
- Project folder structure
- How to run, build, test, or deploy the app
- Status / roadmap summary

### 3b. Keep the public info pages in sync
SNBudget's public pages — **About** (`src/pages/About.jsx`), **Privacy**
(`src/pages/Privacy.jsx`), and **Terms** (`src/pages/Terms.jsx`) — are the
user-facing summary of what the app is, how it handles data, and what users
can / can't do. They must never lie. You **must** update them whenever any
of the following change:

- **About:** product scope (a feature is added, removed, renamed, or its
  behavior meaningfully changes — auth, budgeting, transactions, splits,
  balances, settle-up, insights, imports), non-goals, current status, or
  privacy stance.
- **Privacy:** what data is collected, stored, shared, retained, or sent to
  third parties; the auth model; the security posture. Bump the
  "Last updated" date.
- **Terms:** what users can / can't do, payments or money-movement claims,
  liability, dispute / settle-up handling, eligibility. Bump the
  "Last updated" date.

If a change touches one of these areas but you have a strong reason not to
update the page in the same change, justify it explicitly in the final
response and leave a TODO in `documents/changelog.md` under `[Unreleased]`.

### 4. Add or update tests
- Tests use **Vitest** + **React Testing Library** + **jsdom**.
- Tests live next to the code they cover (`Foo.jsx` ↔ `Foo.test.jsx`,
  `bar.js` ↔ `bar.test.js`).
- Every new **component, hook, or utility** requires at least one meaningful
  test (render + key behavior).
- Every **bug fix** requires a regression test that fails without the fix.
- Prefer user-centric queries (`getByRole`, `getByLabelText`) over
  implementation details.

### 5. Keep dependencies healthy
You are responsible for the health of `package.json` / `package-lock.json`.

#### 5a. Vulnerability scan (mandatory)
- Whenever you **add, upgrade, or downgrade** a dependency, validate it for
  known CVEs **before** committing the change. Use the available CVE
  validation tooling against the npm ecosystem and prefer the minimum
  non-vulnerable version it recommends.
- Run `npm audit` after any change that touches `package.json`. If new
  vulnerabilities appear:
  - **Critical / High:** must be resolved in the same change (bump,
    replace, or document a concrete mitigation). Do **not** ship leaving
    these open.
  - **Moderate / Low:** fix opportunistically; if deferred, log a TODO in
    `documents/changelog.md` under `[Unreleased] > Security` with the
    advisory ID and the reason.
- Never run `npm audit fix --force` blindly — inspect proposed changes first.

#### 5b. Outdated dependencies
- Run `npm outdated` whenever you touch `package.json`. For anything reported:
  - **Patch / minor** updates: bump them in the same change unless there's a
    specific reason not to.
  - **Major** updates: do **not** auto-bump. Note them in
    `documents/changelog.md` under `[Unreleased] > Maintenance` with the
    breaking-change implications, and surface them to the user.
- After any dependency change, re-run `npm install`, then `npm run lint` and
  `npm test`. Update lockfiles together with `package.json` in the same
  change. Remove unused deps with `npm uninstall`.

#### 5c. Document dependency changes
- Any add / upgrade / removal of a dependency must be reflected in
  `documents/changelog.md` under `[Unreleased]` (`Added` / `Changed` /
  `Removed` / `Security`), with the package name and version delta.
- New tech-stack categories (router, state library, testing tool, etc.) must
  also update `documents/architecture.md` and the README's tech-stack table.

### 6. Verify
Before declaring the task done, run:

```bash
npm run lint
npm test
```

Both must pass. If you cannot run them in your environment, say so explicitly
in your final message and list what you would have run, **including** the
dependency-health commands from step 5 (`npm audit`, `npm outdated`).

## Style & conventions (quick reference)

- React function components only; PascalCase filenames matching exports.
- Tailwind utility classes for styling. Support `dark:` variants where it makes
  sense. Avoid custom CSS unless Tailwind genuinely cannot express it.
- Money is handled as **integer minor units** (cents) — never floats — once a
  money helper exists at `src/lib/money.js`.
- Keep components small and composable; extract repeated UI into
  `src/components/`.
- Do not introduce a state-management library, router, or data-fetching
  library without (a) justifying it and (b) recording the decision in
  `documents/architecture.md`.
- **No duplicate code (DRY).** Before writing a new component, hook, util,
  Tailwind class group, or constant, scan the codebase (`src/components/`,
  `src/lib/`, `src/hooks/`, `src/pages/`) for an existing implementation. If
  one exists, reuse or extend it instead of copying. If two places end up
  doing the same thing, extract the shared piece in the same change. As a
  rule of thumb, repeating the same logic or markup more than twice is a
  signal to refactor immediately. If you choose not to extract, justify it
  in the final response.

## Definition of done (checklist for the AI)

- [ ] Code change implemented and self-consistent
- [ ] `documents/` updated (feature/architecture/domain as relevant)
- [ ] `documents/changelog.md` has a new `[Unreleased]` entry
- [ ] `README.md` updated if user-visible setup/structure changed
- [ ] `src/pages/About.jsx`, `src/pages/Privacy.jsx`, and `src/pages/Terms.jsx`
      updated if product scope, data handling, terms/eligibility, status, or
      privacy stance changed (with "Last updated" bumped on Privacy / Terms)
- [ ] Tests added or updated; `npm test` passes
- [ ] `npm run lint` passes
- [ ] Any added/changed dependency was CVE-validated before install
- [ ] `npm audit` reports **no** new High/Critical advisories
- [ ] `npm outdated` reviewed; patch/minor bumps applied or explicitly deferred
      with a note in `documents/changelog.md`

If any item is intentionally skipped, **explain why** in the final response.

