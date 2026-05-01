# Frontend Architecture

> This is a living document. Update it whenever the structure, stack, or
> conventions change.

## Stack

- **React 19** with function components and hooks.
- **Vite** for dev server and build.
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin. The single
  entry point is `@import "tailwindcss";` in `src/index.css` — no
  `tailwind.config.js` is required for v4 unless we need theme customization.
- **react-router-dom v7** for client-side routing. `BrowserRouter` is mounted
  in `src/main.jsx`; the route table lives in `src/App.jsx`. Internal
  navigation must use `<Link to="...">` (never `<a href>`) to avoid full
  reloads.
- **Vitest** + **React Testing Library** + **jsdom** for tests.
- **ESLint** (flat config) for static analysis.

## Folder layout (current)

```
src/
├── assets/            # Static assets imported by components
├── components/        # Reusable UI: Button, Header, Footer, Layout, ...
├── pages/             # Route-level components: Home, About, ...
├── test/setup.js      # Global test setup (jest-dom matchers, cleanup)
├── App.jsx            # Composes Layout + the route table
├── App.test.jsx       # Tests for App
├── index.css          # Tailwind entry
└── main.jsx           # ReactDOM bootstrap (mounts BrowserRouter)
```

## App shell

- `components/Layout.jsx` is the single chrome wrapper for every page. It
  renders `Header` on top, the page `children` in a `<main>` that flexes to
  fill the viewport, and `Footer` pinned to the bottom.
- `components/Header.jsx` is the global top bar. For unauthenticated users it
  shows the brand on the left and **Sign in** / **Sign up** actions in the
  top-right. When auth lands, this component will swap in a user menu.
- `components/Footer.jsx` is the static footer used across the whole app
  (links to About / Privacy / Terms, dynamic copyright year).
- `components/Button.jsx` is the **only** place button styling lives. Use it
  (with `variant` and `as` props) instead of re-typing button Tailwind
  classes. Pass `as={Link} to="..."` to render a router link with consistent
  styling.

## Routing

- Router: `react-router-dom` v7. A single `<BrowserRouter>` lives in
  `src/main.jsx`. The route table is centralized in `src/App.jsx`.
- Current routes:
  - `/` → `pages/Home.jsx`
  - `/about` → `pages/About.jsx`
  - `*` → redirect to `/` (until a dedicated 404 page exists)
- Use `<Link>` / `<NavLink>` for in-app navigation; never bare `<a href>` for
  internal routes.

## The public info pages are part of the contract

`src/pages/About.jsx`, `src/pages/Privacy.jsx`, and `src/pages/Terms.jsx`
are the public, user-facing description of what SNBudget does, how it
handles data, and what users can / can't do. They must stay accurate. Any
change that touches product scope, data handling, terms / eligibility,
non-goals, current status, or privacy stance must update the matching
page(s) in the same change — and bump the "Last updated" date on Privacy /
Terms. This is enforced by the AI workflow in
`.github/copilot-instructions.md` (step 3b + DoD).

### Planned folders (added as features arrive)

```
src/
├── features/          # Feature slices: budgets/, transactions/, splits/, ...
├── hooks/             # Shared custom hooks
├── lib/               # Pure utilities (money math, date helpers, ...)
└── api/               # Backend client (added when the API exists)
```

## Conventions

### Components

- One component per file, **PascalCase** filename matching the export.
- Co-locate styles via Tailwind classes in JSX. No CSS modules unless we hit a
  case Tailwind cannot express cleanly.
- Prefer composition over props explosion. Lift state only as far as needed.
- **DRY:** before adding a new component or repeating a Tailwind class group,
  check `src/components/` for an existing primitive (e.g. `Button`) and reuse
  or extend it. Extract on the second duplication, not the third.

### State management

- Start with React local state + context. Introduce a library (Zustand, Redux
  Toolkit, TanStack Query) only when justified, and document the decision here.

### Tests

- Tests live next to the code they cover: `Foo.jsx` ↔ `Foo.test.jsx`.
- Pure utilities use `*.test.js`.
- Use **React Testing Library** queries that mirror user behavior
  (`getByRole`, `getByLabelText`) over implementation details.
- Every new component / hook / utility requires at least one meaningful test.
- Run `npm test` before opening a PR / committing a change.

### Styling

- Tailwind utility classes only. If a pattern repeats often, extract it to a
  small component (e.g. `<Button />`) rather than `@apply`-ing into a CSS file.
- Support dark mode using Tailwind's `dark:` variants.

### Money

- All monetary values must eventually be handled as integer minor units (cents)
  to avoid floating-point bugs. A `lib/money.js` helper will be introduced
  before transaction features land.

## Backend integration (planned)

- A separate API repository will expose REST or GraphQL endpoints. Until it
  exists, features may be developed against in-memory mocks behind an `api/`
  module so swapping in real endpoints is mechanical.

