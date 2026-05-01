# Frontend Architecture

> This is a living document. Update it whenever the structure, stack, or
> conventions change.

## Stack

- **React 19** with function components and hooks.
- **Vite** for dev server and build.
- **Tailwind CSS v4** via the official `@tailwindcss/vite` plugin. The single
  entry point is `@import "tailwindcss";` in `src/index.css` — no
  `tailwind.config.js` is required for v4 unless we need theme customization.
- **Vitest** + **React Testing Library** + **jsdom** for tests.
- **ESLint** (flat config) for static analysis.

## Folder layout (current)

```
src/
├── assets/            # Static assets imported by components
├── test/setup.js      # Global test setup (jest-dom matchers, cleanup)
├── App.jsx            # Root component
├── App.test.jsx       # Tests for App
├── index.css          # Tailwind entry
└── main.jsx           # ReactDOM bootstrap
```

### Planned folders (added as features arrive)

```
src/
├── components/        # Reusable UI building blocks (Button, Card, ...)
├── features/          # Feature slices: budgets/, transactions/, splits/, ...
├── hooks/             # Shared custom hooks
├── lib/               # Pure utilities (money math, date helpers, ...)
├── pages/ or routes/  # Route-level components (once a router is added)
└── api/               # Backend client (added when the API exists)
```

## Conventions

### Components

- One component per file, **PascalCase** filename matching the export.
- Co-locate styles via Tailwind classes in JSX. No CSS modules unless we hit a
  case Tailwind cannot express cleanly.
- Prefer composition over props explosion. Lift state only as far as needed.

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

