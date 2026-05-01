# Roadmap

> Phased plan. Each phase is "done" only when the relevant docs, tests, README,
> and changelog are also updated.

## Phase 0 — Foundation ✅ (in progress)

- [x] Vite + React 19 scaffold
- [x] Tailwind CSS v4 wired up
- [x] Vitest + React Testing Library configured
- [x] `documents/` folder with product, architecture, domain, roadmap
- [x] AI workflow instructions (`.github/copilot-instructions.md`)
- [ ] Basic app shell (header, layout container, routing-ready)

## Phase 1 — Local-only budgeting

- [ ] Categories CRUD (in-memory / localStorage)
- [ ] Budgets CRUD
- [ ] Transactions CRUD
- [ ] Budget progress view (per category, current period)
- [ ] Money utility (`src/lib/money.js`) with full unit tests

## Phase 2 — Splits (still local)

- [ ] "Friends" list (mock users)
- [ ] Create split (equal, shares, percent, exact)
- [ ] Split materializes per-participant transactions
- [ ] Balances view ("you owe / are owed")
- [ ] Settle up flow

## Phase 3 — Backend integration

- [ ] API client module
- [ ] Auth (login / signup)
- [ ] Replace local persistence with API
- [ ] Real multi-user splits

## Phase 4 — Polish

- [ ] Insights / charts
- [ ] CSV import
- [ ] Mobile-friendly layout pass

