# Changelog

All notable changes to SNBudget frontend are recorded here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
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

