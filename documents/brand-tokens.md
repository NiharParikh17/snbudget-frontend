# SNBudget Brand Tokens

`brand-tokens.json` is the **single, language-neutral source of truth** for
SNBudget's visual identity. Both the web frontend and the backend (for
transactional emails like account verification, password reset, settle-up
notifications, etc.) consume the same file so the brand never drifts between
the app UI and inboxes.

> If you change a colour, the logo, the wordmark, or any email-specific value,
> change it **here** — not in CSS, not in the email templates. Both surfaces
> re-read from this file.

## Where it's used

- **Frontend**: source values for `src/index.css` brand CSS variables, the
  `Logo` SVG, and Tailwind theme overrides. (Currently mirrored manually;
  may be imported directly in a future change.)
- **Backend**: email templates (verification, password reset, invitations,
  settle-up reminders). The backend should load `brand-tokens.json` at build
  time (or fetch it from a published artifact) and substitute values into the
  email HTML / MJML.

## Schema (v1.0.0)

| Section | Purpose |
|---------|---------|
| `product` | Name, tagline, public URLs, `from` / `support` addresses for emails. |
| `logo` | Wordmark text, favicon path, **inline SVG** for web, **absolute PNG URLs** for emails (Gmail strips SVG), and the brand gradient stops. |
| `colors.light` / `colors.dark` | Full palette for each theme: brand, surfaces, text, borders, semantic states. |
| `typography` | Font stacks (with system fallbacks), weight scale, type scale, line heights. |
| `spacing` | Named spacing scale in pixels. |
| `radius` | Named corner-radius scale. |
| `shadow` | Named elevation tokens. |
| `email` | Email-specific overrides: max width, outer/container backgrounds for light & dark, header gradient, button styling, footer text, and a `rules` array of email-client gotchas the backend templates must respect. |

## Email rules (must read for backend)

The `email.rules` array is **non-negotiable** guidance for whatever templating
engine the backend uses (MJML, Handlebars, Thymeleaf, Jinja, …):

1. Use **table-based** layout — no flex/grid.
2. **Inline all CSS** — Gmail strips `<style>` blocks in some contexts.
3. Reference the logo via the absolute `logo.iconPngUrl` URL — **do not embed
   SVG** (Gmail strips it).
4. Always include a **system-font fallback stack**; web fonts are unreliable
   in mail clients.
5. Keep total width ≤ `email.maxWidthPx` (600 px).
6. Always ship a **plain-text alternative** alongside the HTML part.

## Versioning

- Bump `version` (semver) when the schema changes:
  - **Major**: removed/renamed keys (breaking for consumers).
  - **Minor**: added keys.
  - **Patch**: value-only changes (e.g. brand colour tweak).
- Bump `updatedAt` (ISO date) on every change.
- Backend should pin to a `^1.x` range so additive changes don't break it.

## Adding a new token

1. Add the key under the appropriate section in `brand-tokens.json`.
2. Bump `version` and `updatedAt`.
3. Update this doc's schema table if a new section was introduced.
4. Update the consumer (frontend CSS / Tailwind theme, backend email
   template) in the same change so the value is actually used.
5. Log the delta in `documents/changelog.md` under `[Unreleased]`.

