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

### 4. Add or update tests
- Tests use **Vitest** + **React Testing Library** + **jsdom**.
- Tests live next to the code they cover (`Foo.jsx` ↔ `Foo.test.jsx`,
  `bar.js` ↔ `bar.test.js`).
- Every new **component, hook, or utility** requires at least one meaningful
  test (render + key behavior).
- Every **bug fix** requires a regression test that fails without the fix.
- Prefer user-centric queries (`getByRole`, `getByLabelText`) over
  implementation details.

### 5. Verify
Before declaring the task done, run:

```bash
npm run lint
npm test
```

Both must pass. If you cannot run them in your environment, say so explicitly
in your final message and list what you would have run.

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

## Definition of done (checklist for the AI)

- [ ] Code change implemented and self-consistent
- [ ] `documents/` updated (feature/architecture/domain as relevant)
- [ ] `documents/changelog.md` has a new `[Unreleased]` entry
- [ ] `README.md` updated if user-visible setup/structure changed
- [ ] Tests added or updated; `npm test` passes
- [ ] `npm run lint` passes

If any item is intentionally skipped, **explain why** in the final response.

