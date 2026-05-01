# Changelog

All notable changes to SNBudget frontend are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

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

