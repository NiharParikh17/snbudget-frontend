# Changelog

All notable changes to SNBudget frontend are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- **Subscription enrollment from `/choose-plan`** — the **Continue**
  button is now wired up. Clicking it calls
  `POST /api/subscriptions` with `{ productId, autoRenew: true }`
  (the backend forces `autoRenew=false` for LIFETIME products),
  refreshes `subscriptionStatus` on the auth context to `'active'`,
  and navigates the user to `/welcome` — the same destination as
  users who already had an active subscription. There is **no
  payment step yet**: the backend simply records the subscription.
  New `subscribe(accessToken, { productId, autoRenew })` wrapper added
  to `src/api/subscriptions.js`. While the request is in flight the
  button shows "Starting…" and is disabled; on failure an inline
  `role="alert"` error is rendered and the button is re-enabled. The
  previous "Coming soon" tooltip + helper text were replaced with
  "No payment required yet — checkout will be added before billing
  goes live." Tests: 2 new cases in `subscriptions.test.js` (POST
  shape, explicit `autoRenew=false` honored), and 2 new cases in
  `ChoosePlan.test.jsx` (happy path subscribes → refreshes → routes
  to `/welcome`; failure path shows alert + re-enables Continue).
  Existing "disabled Continue" test rewritten as "enabled Continue
  with helper text". Total: **117 tests** (was 113).

### Changed
- **About / Privacy / Terms** copy updated to reflect that selecting
  a plan now creates a real subscription record on the backend
  (still with no payment step). About: removed the "preview only"
  language. Privacy: clarified that a subscription record tied to
  the user ID is now stored, but no payment data is collected and
  no payment processor is contacted. Terms: clarified that picking
  a plan enrolls the account but no fees are owed and no checkout
  step exists yet.

### TODO (under [Unreleased])
- **Checkout / payments UI** — the subscribe call is now live but
  there is still no payment collection. Once a processor is chosen,
  add the checkout step, then bump the relevant copy on About /
  Privacy / Terms with the chosen payment-processor details and
  pricing / billing / refund / renewal terms.
- **Currency from backend** — `lib/price.js` hard-codes USD; add a
  `currency` field to `ProductResponse` (or expose it via a separate
  catalog meta endpoint) and wire it through `formatAmount`.
- **Plans entry point in the Header** — once active subscribers can
  upgrade/downgrade, expose a "Plans" link from the Header user menu.
- **Auto-renew toggle on the plan picker** — currently we always
  send `autoRenew: true`. When real billing lands, expose an
  explicit toggle (and hide it for LIFETIME plans, which the
  backend forces to `false`).

### Security
- No new runtime dependencies — only native `fetch`. `npm audit`
  to be re-verified after this change is applied.

---

## [Unreleased — earlier this iteration]

### Added
- **Subscription gating + plan picker** — after every successful
  authentication, `AuthContext` calls `GET /api/subscriptions/me` and
  exposes a new `subscriptionStatus` (`'unknown' | 'none' | 'active'`)
  on the auth context. A `204 No Content` (or any error — fail closed)
  maps to `'none'`. New guard `src/components/RequireSubscription.jsx`
  composes inside `RequireAuth` and redirects users without an active
  subscription to a new `/choose-plan` screen. `/welcome` is now
  wrapped with both guards.
- **`pages/ChoosePlan.jsx`** — industry-style 3-column pricing grid
  (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) listing products from
  `GET /api/subscriptions/products`. Cards are a proper accessible
  radio group (`role="radiogroup"` / `role="radio"`, arrow keys + Home
  / End + space / enter). The first plan is preselected. A "Best value"
  badge is shown on the YEARLY plan when its price is strictly cheaper
  than 12× any MONTHLY plan in the catalog. Loading skeletons, error +
  retry, and an empty state with sign-out are all covered. The
  **Continue** button is rendered but **disabled** with a `title="Coming
  soon"` tooltip + visible helper text — no `POST /api/subscriptions`
  call is made yet (deferred to the checkout PR). Active subscribers
  are bounced to `/welcome`.
- **`api/subscriptions.js`** — wrappers `listProducts(accessToken)` and
  `getCurrentSubscription(accessToken)` against the gateway base path
  `/api/subscriptions`. JSDoc documents the `204 → null` contract.
- **`lib/price.js`** — `formatAmount`, `formatPrice`, and
  `compareProducts` helpers. Currency hard-coded to USD until the
  backend exposes a currency field (see TODO below).
- Tests: `subscriptions.test.js` (3 tests — path, bearer header, 204
  → null), `price.test.js` (7 tests), `RequireSubscription.test.jsx`
  (4 tests), `ChoosePlan.test.jsx` (9 tests). Existing
  `AuthContext.test.jsx` extended with subscription-bootstrap +
  fail-closed cases (the `logout` test was rewritten to find the
  `/api/auth/logout` call by URL match because subscription `/me` now
  shifts the call index). `App.test.jsx` gains a `/choose-plan`
  redirect-when-anonymous case.

### Changed
- **About page** — "Where we are today" updated to mention the new
  subscription-plan picker (preview only; checkout not yet enabled).
- **Privacy page** — added a paragraph clarifying that no payment data
  is collected, no payment processor is contacted, and that the section
  will be expanded once checkout goes live.
- **Terms page** — added a paragraph stating that no payment is taken
  and no subscription fees are owed yet, and that pricing / billing /
  refund / renewal terms will be added before checkout goes live.

### Security
- **Fail-closed subscription gate** — any error from
  `/api/subscriptions/me` (network, 5xx, malformed body) maps to
  `subscriptionStatus = 'none'` so a transient outage cannot
  accidentally let an unsubscribed user into gated pages.
- Subscription state is wiped on logout (`setAnonymous` resets
  `subscriptionStatus` back to `'unknown'`).
- No new runtime dependencies — only native `fetch`. `npm audit`
  remains at **0 vulnerabilities** (to be re-verified by `npm audit` /
  `npm outdated` after this change is applied).

### TODO (under [Unreleased])
- **Checkout (POST /api/subscriptions)** — wire the Continue button on
  `/choose-plan`, add a confirmation step, then bump the relevant
  copy on About / Privacy / Terms with the chosen payment-processor
  details. The disabled-button "Coming soon" UX is the placeholder.
- **Currency from backend** — `lib/price.js` hard-codes USD; add a
  `currency` field to `ProductResponse` (or expose it via a separate
  catalog meta endpoint) and wire it through `formatAmount`.
- **Plans entry point in the Header** — once active subscribers can
  upgrade/downgrade, expose a "Plans" link from the Header user menu.

### Changed
- **API gateway** — all frontend API calls now route through the SNBudget
  API gateway at `http://localhost:8080` (was `http://localhost:8081`
  pointing directly at the `identity-management` service). Updated the
  `DEFAULT_BASE_URL` fallback in `src/lib/apiClient.js` and the example
  value + comment in `.env.example`. Endpoint basepaths (`/api/auth/*`,
  `/api/users/*`, etc.) are unchanged. `documents/architecture.md`
  "Backend integration" section updated to document the gateway topology.
  > ⚠️ If you have a local `.env` or `.env.local` file with
  > `VITE_API_BASE_URL=http://localhost:8081` you must update it to
  > `http://localhost:8080` for local development to work.

 (`src/pages/EmailVerified.jsx`, route
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

