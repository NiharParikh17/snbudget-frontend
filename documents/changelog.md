# Changelog

All notable changes to SNBudget frontend are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Email verification result page** (`src/pages/EmailVerified.jsx`, route
  `/email-verified`) — public landing page the `identity-management`
  backend redirects to after a user clicks the verification link in their
  welcome email. Reads `?status` from the URL only (no API call — the
  backend has already verified the token). Renders one of two states:
  - **Success** (`?status=success`): "Email verified!" heading, confirmation
    copy, a live 10-second countdown ("Redirecting you to sign in in N
    seconds…") and an auto-redirect to `/signin` (with a CTA fallback
    "Go to sign in now").
  - **Invalid** (anything else, including missing/unknown `status`): "Link
    is no longer valid" heading + red `role="alert"` banner and a single
    "Go to sign in" CTA. Defensive default — backend failure detail is
    never exposed in the URL or to the user.
  Reuses `AuthFormShell` + `Button` for visual consistency with `/signin`
  and `/signup`. New tests in `src/pages/EmailVerified.test.jsx` (9 tests:
  copy, CTA href, countdown ticks with singular/plural handling, auto-nav
  at 10 s, no nav from invalid state, missing/unknown/raw-status
  defensiveness, and interval cleanup on unmount). Total: **87 tests**
  (was 78). Route table in `documents/architecture.md` updated.

### Changed
- **Dependency bumps (patch/minor)** — `eslint` 10.2.1 → 10.3.0 and
  `globals` 17.5.0 → 17.6.0. CVE-validated (no known CVEs); `npm audit`
  remains at 0 vulnerabilities; lint + tests pass.

### Added
- **Brand tokens** (`documents/brand-tokens.json` + `documents/brand-tokens.md`) —
  language-neutral, versioned source of truth for SNBudget's visual identity:
  product info, logo (inline SVG + absolute PNG URLs for emails), full
  light/dark colour palettes, typography scale, spacing, radius, shadow, and
  an `email` section with email-client-safe overrides (max width, container
  backgrounds, header gradient, button styling, footer text, hard rules).
  Intended to be consumed by both this frontend and the backend's
  transactional-email templates so verification / password-reset / settle-up
  emails stay on-brand instead of drifting (e.g. the current green-themed
  verification email). Schema versioned at `1.0.0`; backend should pin to
  `^1.x`. Linked from `documents/README.md` and `documents/architecture.md`.

### Added
- **Authentication UI** — `/signup` and `/signin` pages backed by the
  SNBudget Identity API (`POST /api/users`, `POST /api/auth/login`,
  `POST /api/auth/refresh`, `POST /api/auth/logout`). Registration sends
  the user to `/signin?registered=1` with a "check your email" banner
  (verification is enforced by the backend; the UI surfaces whatever
  message the API returns). After login the user lands on a temporary
  `/welcome` placeholder page (`src/pages/Welcome.jsx`) that confirms
  sign-in and offers a Sign out button — the real dashboard will replace
  this later.
- **AuthContext** (`src/context/AuthContext.jsx`) — `AuthProvider` +
  `useAuth` hook. Owns the in-memory auth session
  `{ status, accessToken, userId, expiresAt }`. **Access token lives only
  in React state** (never `localStorage`/`sessionStorage`); the
  long-lived refresh token is the backend's HttpOnly cookie. On mount,
  `AuthProvider` performs a silent refresh and then schedules another one
  ~60 s before expiry so the session stays alive without user action.
  Mounted in `src/main.jsx` inside `BrowserRouter`.
- **API client** (`src/lib/apiClient.js`) — typed `request(method, path,
  { body, accessToken })` wrapper around `fetch` that always sends
  `credentials: 'include'`, throws a typed `ApiError` (`status`,
  `message`, `fieldErrors`), and never logs request bodies. Endpoint
  wrappers in `src/api/auth.js` and `src/api/users.js`.
- **Auth UI primitives** — `src/components/AuthFormShell.jsx` (centered
  card with brand mark + heading/subtitle/footer slots) and
  `src/components/FormField.jsx` (labelled input with `aria-invalid` and
  inline error wiring) so the auth pages stay DRY. `RequireAuth`
  (`src/components/RequireAuth.jsx`) guards authenticated-only routes
  (currently just `/welcome`) and bounces anonymous users to `/signin`
  while preserving the requested location in `state.from`.
- **Header user menu** — `Header` now branches on `useAuth().status`,
  showing **My account** + **Sign out** when authenticated and the
  existing Sign in / Sign up actions otherwise.
- **`VITE_API_BASE_URL`** env var (defaults to `http://localhost:8081`)
  documented in `.env.example`.
- **Test helpers** — `src/test/renderWithProviders.jsx` wraps RTL `render`
  in `MemoryRouter` + `AuthProvider`. Global `fetch` is now stubbed in
  `src/test/setup.js` to a rejecting mock so tests cannot accidentally
  hit `localhost:8081`. New tests for `apiClient`, `AuthContext`,
  `SignIn`, `SignUp`, `Welcome`, `AuthFormShell`, `FormField`, and
  `RequireAuth`; existing `Header`, `Layout`, and `App` tests updated
  for the new provider stack and route table. Total: **78 tests** (was
  47).

### Changed
- `src/main.jsx` — `AuthProvider` is now mounted inside `BrowserRouter`
  so its async helpers can use `useNavigate` indirectly via consumers.
- `src/App.jsx` — added `/signin`, `/signup`, and a `RequireAuth`-guarded
  `/welcome` route.

### Security
- New code uses **only native `fetch`** — no new runtime dependencies
  added, so `npm audit` remains at **0 vulnerabilities**. The Identity
  API endpoints were CVE-validated as part of this change (no new
  packages to scan).
- Access tokens are held in memory only; refresh tokens stay in the
  backend-set HttpOnly cookie. Browser console / extensions and any
  XSS payload cannot read either credential from web storage.
- The dev backend at `localhost:8081` MUST send
  `Access-Control-Allow-Credentials: true` with an explicit origin
  (not `*`) for `credentials: 'include'` to work cross-origin.
  Documented in `architecture.md`.

### TODO (under [Unreleased])
- **Password strength rules + meter** — current client-side rule is
  only `minLength: 8` (matching the backend). Add a strength meter and
  stricter requirements (variety, breach check, etc.) once basic auth
  is in real use.
- **Resend verification email** — no backend endpoint yet. Add a
  "Resend verification email" link on `/signin` once the API exposes
  it.
- **Real dashboard** — replace the `/welcome` placeholder with the
  authenticated home / dashboard once budgeting features land.

### Added
- **ThemeContext** (`src/context/ThemeContext.jsx`) — app-wide theme management
  with `ThemeProvider` + `useTheme` hook. Supports `'system'` (OS default,
  used pre-auth everywhere), `'light'`, and `'dark'` modes. Chosen mode is
  persisted in `localStorage` under `snbudget-theme`; a future Settings page
  will sync it to the user's profile. `ThemeProvider` is mounted once in
  `src/main.jsx` above `BrowserRouter`.
- **Logo component** (`src/components/Logo.jsx`) — reusable inline-SVG brand
  mark (lightning bolt + gradient wordmark). Accepts `iconOnly` and `className`
  props. Used in both `Header` and `Footer` as the single source of truth for
  the brand mark.
- **Class-based dark mode** — `@custom-variant dark` in `src/index.css` wires
  Tailwind's `dark:` utilities to the `.dark` class on `<html>` (managed by
  `ThemeContext`). System-default behaviour is preserved: when `theme='system'`
  the context mirrors `window.matchMedia('(prefers-color-scheme: dark)')`.
- **Inter typeface** — loaded from Google Fonts in `index.html` and applied
  globally in `Layout` via `font-[Inter,system-ui,sans-serif]`.
- **Gradient hero section** in `Home` — radial violet/cyan blobs, an early
  access badge, a stronger gradient headline, and a trust strip
  ("No bank linking required", "Your data stays yours", "Free during early
  access"). CTAs updated to "Get started free" / "Sign in".
- **Feature card icons** (inline SVG) on the Home page feature grid.
- Tests for `ThemeContext` (8 tests, with `matchMedia` stub) and `Logo`
  (3 tests). `Header` and `Footer` tests updated for the new Logo link.
  `Button` test extended with a `cursor-pointer` assertion. `Home` test
  updated for the new secondary CTA label. Total: 47 tests (was 33).
- `matchMedia` stub added to `src/test/setup.js` so any component using the
  Media Query API works in jsdom without per-test mocking.

### Changed
- **Color theme migrated from indigo → violet** to align with the existing
  favicon palette (`#7c3aed` primary, `#06b6d4` cyan accent). Every `indigo-`
  class in `Header`, `Footer`, `About`, `Privacy`, `Terms`, and `Button` is
  now `violet-`.
- **Button** — rounded to `rounded-xl`; padding increased to `px-5 py-2.5`;
  `font-medium` → `font-semibold`; added `cursor-pointer`, `select-none`, and
  `transition-all duration-200`; hover now lifts the button (`-translate-y-px`)
  and adds a coloured shadow on primary.
- **Header** — taller (`h-16`); heavier backdrop blur (`backdrop-blur-md`);
  brand now renders `<Logo />` with `aria-label="SNBudget home"` instead of
  plain text.
- **Footer** — logo home-link replaces the plain copyright text on the left;
  logo + nav + year laid out in one responsive flex row.
- **Layout** — Inter font applied globally; `antialiased` added.
- **Home hero** — richer gradient background, larger headline (`text-5xl
  sm:text-6xl font-extrabold`), trust strip, updated CTA labels.
- **Home feature cards** — `rounded-2xl`, subtle hover lift, icon badge.
- **About / Privacy** feature/principle cards — `rounded-2xl`, `p-5`,
  `shadow-sm`.
- `index.html` — title changed to "SNBudget — Budget smarter. Split easier.",
  `meta description` added, Google Fonts `<link>` added.

- **About page** at `src/pages/About.jsx` (route `/about`) describing what
  SNBudget is, who it's for, what you can do, how it works, current status,
  non-goals, and privacy stance. Linked from the global Footer.
- **Routing** via `react-router-dom@^7.14.2`. `BrowserRouter` mounted in
  `main.jsx`; `App.jsx` declares routes for `/` (Home) and `/about` (About),
  with unknown paths redirected to `/`. `Header`, `Footer`, `Home`, and
  `About` use `<Link>` for internal navigation.
- AI-workflow rule: **About page must be kept in sync** with product scope,
  non-goals, status, and privacy stance on every relevant change
  (`.github/copilot-instructions.md` step 3b + Definition-of-Done).

### Changed
- `Header`, `Footer`, and `Home` switched from raw `<a>` tags to
  `react-router-dom` `<Link>`s for internal routes (no full page reloads).
- Existing tests for `Header`, `Footer`, `Layout`, `Home`, and `App` updated
  to wrap rendering in `MemoryRouter`. Test count: 21 passing.

### Security
- `react-router-dom@7.14.2` CVE-validated before install — no known CVEs.
  `npm audit`: 0 vulnerabilities. `npm outdated`: clean.

---

## [Unreleased — earlier this iteration]

### Added
- **About page** at `src/pages/About.jsx` (route `/about`) describing what
  SNBudget is, who it's for, what you can do, how it works, current status,
  non-goals, and privacy stance. Linked from the global Footer.

### Added
- **App chrome** components: `Header` (sticky, with brand + Sign in / Sign up
  in the top-right) and `Footer` (static across the app, with About / Privacy
  / Terms links and dynamic copyright year).
- **`Layout`** component that wires Header + Footer around any page so the
  chrome is defined in exactly one place.
- **`Button`** primitive (`primary` / `secondary` / `ghost` variants, `as`
  prop) — single source of truth for button styling.
- Tests for `Button`, `Header`, `Footer`, `Layout`, `Home`, and an updated
  `App` test (14 tests total, all passing).
- DRY rule added to `.github/copilot-instructions.md`: scan for existing
  components/utilities before writing new code; extract on the second
  duplication.
- Dependency-health workflow in `.github/copilot-instructions.md`: every change
  must CVE-validate new/changed dependencies, run `npm audit` and
  `npm outdated`, apply safe (patch/minor) upgrades, and log dependency deltas
  here under `[Unreleased]`.
- Initial project scaffolding with React 19 + Vite.
- Tailwind CSS v4 integrated via `@tailwindcss/vite`.
- Vitest + React Testing Library + jsdom set up; sample tests for `App`.
- `documents/` folder with `product-overview`, `architecture`, `domain-model`,
  `roadmap`, and this changelog.
- `.github/copilot-instructions.md` defining the required workflow for any
  change (update docs, update README, add tests).
- Placeholder SNBudget landing page replacing the Vite/React boilerplate.

### Changed
- README rewritten to describe SNBudget instead of the Vite template.

### Removed
- Boilerplate assets: `src/App.css`, `src/assets/react.svg`, `src/assets/hero.png`,
  `public/icons.svg`.

