# SNBudget — Frontend

> **Budget smarter. Split easier.**

SNBudget is a personal budgeting app with built-in **expense splitting** between
users (think: a budgeting tool fused with the social-payments model of
Splitwise). Splits automatically reflect back into each participant's budget so
your category spend, balances, and "who-owes-whom" stay in sync.

This repository contains the **web frontend** for SNBudget. The backend lives in
a separate repository (TBD).

---

## Tech stack

| Concern         | Choice                                    |
| --------------- | ----------------------------------------- |
| Framework       | React 19                                  |
| Build / dev     | Vite                                      |
| Styling         | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Language        | JavaScript (JSX) — TS may be added later  |
| Testing         | Vitest + React Testing Library + jsdom    |
| Linting         | ESLint (flat config)                      |

---

## Getting started

```bash
npm install
npm run dev          # start dev server
npm run build        # production build
npm run preview      # preview production build
npm run lint         # eslint
npm test             # run unit tests once
npm run test:watch   # vitest in watch mode
npm run test:ui      # vitest UI
```

Node 20+ is recommended.

---

## Project structure

```
snbudget-frontend/
├── documents/              # Living design & product docs (see documents/README.md)
├── public/                 # Static assets served as-is
├── src/
│   ├── assets/             # Imported assets (images, svgs)
│   ├── components/         # Reusable UI (Button, Header, Footer, Layout, …)
│   ├── pages/              # Route-level components (Home, About, …)
│   ├── test/setup.js       # Vitest setup (RTL matchers, cleanup)
│   ├── App.jsx             # Composes Layout + the route table
│   ├── App.test.jsx        # Tests for App
│   ├── index.css           # Tailwind entry (@import "tailwindcss")
│   └── main.jsx            # React entry point (mounts BrowserRouter)
├── .github/
│   └── copilot-instructions.md   # Required workflow for AI assistants
├── eslint.config.js
├── vite.config.js          # Vite + Tailwind plugin + Vitest config
└── package.json
```

---

## Working on this repo

Every change in this repo must follow the workflow described in
[`.github/copilot-instructions.md`](./.github/copilot-instructions.md):

1. **Update or add docs** in `documents/` for any new feature, model change, or
   architectural decision.
2. **Update this README** when scripts, structure, stack, or how-to-run
   instructions change.
3. **Add tests** (Vitest + React Testing Library) for any new component,
   utility, hook, or bug fix. Tests live next to source as `*.test.js(x)`.
4. Run `npm run lint && npm test` before considering work done.

See [`documents/README.md`](./documents/README.md) for the doc index.

---

## Status

🚧 Early scaffolding. The app currently ships unauthenticated public pages —
**Home** (`/`), **About** (`/about`), **Privacy** (`/privacy`), and
**Terms** (`/terms`) — inside the global `Layout` (Header with Sign in /
Sign up, static Footer). Routing is wired up with `react-router-dom`. Auth
flows and product features are next — see
[`documents/roadmap.md`](./documents/roadmap.md).
