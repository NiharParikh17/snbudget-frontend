# SNBudget Documents

This folder is the **single source of truth** for product, design, and
architecture decisions for SNBudget. It must be kept in sync with the codebase.

## Index

| Doc                                                | Purpose                                           |
| -------------------------------------------------- | ------------------------------------------------- |
| [`product-overview.md`](./product-overview.md)     | Vision, target users, core feature pillars        |
| [`architecture.md`](./architecture.md)             | High-level frontend architecture & conventions    |
| [`domain-model.md`](./domain-model.md)             | Core entities (User, Budget, Transaction, Split…) |
| [`roadmap.md`](./roadmap.md)                       | Phased plan of what we're building, and when      |
| [`brand-tokens.md`](./brand-tokens.md)             | Schema for `brand-tokens.json` (shared visual identity for app + emails) |
| [`brand-tokens.json`](./brand-tokens.json)         | Single source of truth: colors, logo, typography, email styling |
| [`changelog.md`](./changelog.md)                   | Human-readable log of notable changes             |

## Rules for this folder

1. **Every feature gets a doc.** Before building a non-trivial feature, capture
   the intent and contract here so the implementation has something to verify
   against.
2. **Update on every change.** When a feature ships, changes shape, or is
   removed, update the relevant doc(s) and add an entry to `changelog.md`.
3. **Prefer Markdown + diagrams.** Use fenced code blocks for examples and
   Mermaid for diagrams where helpful.
4. **Link, don't duplicate.** Cross-link between docs instead of copy-pasting.

