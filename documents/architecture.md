# Frontend Architecture

> This is a living document. Update it whenever the structure, stack, or
> conventions change.

## Stack

- **React 19** with function components and hooks.
- **Vite** for dev server and build.
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin. The single
  entry point is `@import "tailwindcss";` in `src/index.css`. Dark mode is
  class-based (`@custom-variant dark (&:where(.dark, .dark *))`), managed
  entirely by `ThemeContext`.
- **react-router-dom v7** for client-side routing. `BrowserRouter` is mounted
  in `src/main.jsx`; the route table lives in `src/App.jsx`. Internal
  navigation must use `<Link to="...">` (never `<a href>`) to avoid full
  reloads.
- **Inter** (Google Fonts) — the primary typeface, loaded in `index.html` and
  applied globally via `Layout`.
- **Vitest** + **React Testing Library** + **jsdom** for tests.
- **ESLint** (flat config) for static analysis.

## Folder layout (current)

```
src/
├── assets/            # Static assets imported by components
├── components/        # Reusable UI: Button, Logo, Header, Footer, Layout, ...
├── context/           # React contexts: ThemeContext (theme provider + useTheme hook)
├── pages/             # Route-level components: Home, About, ...
├── test/setup.js      # Global test setup (jest-dom matchers, matchMedia stub, cleanup)
├── App.jsx            # Composes Layout + the route table
├── App.test.jsx       # Tests for App
├── index.css          # Tailwind entry + @custom-variant dark + brand CSS vars
└── main.jsx           # ReactDOM bootstrap (mounts ThemeProvider, BrowserRouter)
```

## App shell

- `components/Layout.jsx` is the single chrome wrapper for every page. It
  renders `Header` on top, the page `children` in a `<main>` that flexes to
  fill the viewport, and `Footer` pinned to the bottom. It also applies the
  Inter typeface globally via `font-[Inter,system-ui,sans-serif]`.
- `components/Header.jsx` is the global top bar. For unauthenticated users it
  shows the **Logo** on the left and **Sign in** / **Sign up** actions in the
  top-right. When auth lands, this component will swap in a user menu.
- `components/Footer.jsx` is the static footer used across the whole app
  (Logo home-link on the left, links to About / Privacy / Terms + copyright
  year on the right).
- `components/Button.jsx` is the **only** place button styling lives. Use it
  (with `variant` and `as` props) instead of re-typing button Tailwind
  classes. Pass `as={Link} to="..."` to render a router link with consistent
  styling.
- `components/Logo.jsx` is the **only** place the brand mark (SVG bolt +
  gradient wordmark) is defined. Use it in any surface that needs the brand
  identity.

## Theme system

`context/ThemeContext.jsx` owns the app-wide colour scheme:

- **`ThemeProvider`** — mounts once in `main.jsx` above `BrowserRouter`.
  Reads the user's preference from `localStorage` (key `snbudget-theme`),
  defaulting to `'system'`. Applies or removes the `.dark` class on
  `<html>` and sets `color-scheme` accordingly.
- **`useTheme()`** — returns `{ theme, setTheme }`. Use this hook inside any
  component that needs to read or change the theme.
- Supported values: `'system'` (follows OS preference), `'light'`, `'dark'`.
- Until a Settings page is built, the app defaults to `'system'` for all
  unauthenticated screens. A future Settings page will call `setTheme` and
  (eventually) persist the choice to the user's profile.
- Tailwind's `dark:` utilities are wired to the `.dark` class via
  `@custom-variant dark (&:where(.dark, .dark *))` in `src/index.css`.

## Colour palette

Split-complementary scheme aligned to the existing favicon:

| Token | Value | Usage |
|-------|-------|-------|
| Primary (light) | `violet-600` `#7c3aed` | Buttons, brand mark, accents |
| Primary (dark) | `violet-400` `#a78bfa` | Same, dark mode |
| Accent | `cyan-500` `#06b6d4` | Gradient highlights |
| Surface (light) | `slate-50` / white | Page + card backgrounds |
| Surface (dark) | `slate-950` / `slate-900` | Page + card backgrounds |

These values are mirrored in [`documents/brand-tokens.json`](./brand-tokens.json),
which is the **language-neutral source of truth** shared with the backend so
transactional emails (verification, password reset, settle-up reminders, …)
stay on-brand. See [`brand-tokens.md`](./brand-tokens.md) for the schema and
the contract with the backend. **Whenever you change a brand value here, also
update `brand-tokens.json` (and bump its `version` + `updatedAt`).**

## Routing

- Router: `react-router-dom` v7. A single `<BrowserRouter>` lives in
  `src/main.jsx`. The route table is centralized in `src/App.jsx`.
- Current routes:
  - `/` → `pages/Home.jsx`
  - `/about` → `pages/About.jsx`
  - `/privacy` → `pages/Privacy.jsx`
  - `/terms` → `pages/Terms.jsx`
  - `/signin` → `pages/SignIn.jsx`
  - `/signup` → `pages/SignUp.jsx`
  - `/email-verified` → `pages/EmailVerified.jsx` (public landing the
    `identity-management` backend redirects to after a verification-link
    click; reads `?status=success|invalid` only — no API call. Anything
    other than `success` is treated as invalid (defensive default). The
    success state auto-redirects to `/signin` after 10 s with a CTA
    fallback.)
  - `/welcome` → `pages/Welcome.jsx` (guarded by `RequireAuth` **and**
    `RequireSubscription`)
  - `/choose-plan` → `pages/ChoosePlan.jsx` (guarded by `RequireAuth`;
    redirects active subscribers to `/welcome`)
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

## Backend integration

- All API calls are routed through the **SNBudget API gateway** at
  `http://localhost:8080` (configurable via `VITE_API_BASE_URL`).
  Endpoint basepaths are unchanged — the gateway transparently proxies to
  the appropriate downstream service (e.g. `identity-management` for
  `/api/auth/*` and `/api/users/*`). Future service endpoints (categories,
  budgets, transactions, splits) will be added behind the same gateway
  and reached via the same `lib/apiClient.js` wrapper without any frontend
  routing change.
- Authentication is implemented end to end (signup, signin, silent refresh,
  logout); see "Auth & API integration" above. Other product APIs will land
  in `src/api/` alongside `auth.js` / `users.js`.
- **Subscription Management API** (`/api/subscriptions/*`, accessed via the
  same gateway) is wrapped in `src/api/subscriptions.js` (`listProducts`,
  `getCurrentSubscription`, `subscribe`). On every successful authentication
  `AuthContext` calls `GET /api/subscriptions/me` and stores the result as
  `subscriptionStatus: 'unknown' | 'none' | 'active'`. A `204 No Content`
  (or any error — fail closed) maps to `'none'`. The
  `components/RequireSubscription.jsx` guard composes inside `RequireAuth`
  and redirects users with no active subscription to `/choose-plan`. From
  `/choose-plan` the user picks a plan and clicks **Continue**, which
  calls `POST /api/subscriptions` with `{ productId, autoRenew: true }`,
  re-runs the `/me` lookup via `refreshSubscription()` so the gate flips
  to `'active'`, and routes to `/welcome`. There is no payment step yet —
  the backend simply records the subscription.
- The gateway MUST send `Access-Control-Allow-Credentials: true` with an
  explicit `Access-Control-Allow-Origin` (not `*`) for
  `credentials: 'include'` to work cross-origin in local dev.

