# Domain Model (draft)

> Initial sketch. Refine as features are designed and built.

## Entities

### SubscriptionProduct

A purchasable plan in the catalog. Owned and managed by the
subscription-management service.

- `id`
- `name`, `description`
- `billingCycle` — `WEEKLY | MONTHLY | YEARLY | LIFETIME`
- `price` (decimal; currency assumed USD until the API exposes one)
- `status` — `ACTIVE | INACTIVE | DEPRECATED`
- `createdAt`, `updatedAt`

### UserSubscription

The caller's link to a `SubscriptionProduct`. Each user has at most one
**active** subscription at a time.

- `id`, `product` (`SubscriptionProduct`)
- `status` — `ACTIVE | CANCELLED | EXPIRED`
- `autoRenew` (forced `false` for `LIFETIME`)
- `startedAt`, `expiresAt` (null for `LIFETIME`), `cancelledAt`
- `changeable` — backend-computed flag; if `false`, the frontend hides the
  "Change plan" action.
- `cancellable` — backend-computed flag; if `false`, the frontend hides the
  "Cancel subscription" action. (Both flags `false` ⇒ the Settings page
  shows a short "this plan can't be changed or cancelled" note in place
  of the buttons.)
- `pendingChange` — embedded `ScheduledProductChange` (or `null`) when a
  product change is queued. Source of the "Plan change scheduled" banner
  on `/settings`.

The frontend gates all authenticated pages on a non-null `ACTIVE`
subscription. `GET /api/subscriptions/me` returns `204 No Content` when
the user has no active subscription, in which case the user is sent to
`/choose-plan`.

Cancellation transitions the subscription to `CANCELLED` but the user
typically retains access until `expiresAt`; the `/settings` page surfaces
this state with a "you'll keep access until …" banner. If the backend
instead drops the record (so `/me` returns 204), the user is routed to
`/choose-plan`.

### ScheduledProductChange

A queued plan change against a `UserSubscription`. The active subscription
embeds the latest pending change inline as
`UserSubscription.pendingChange` (or `null` when none is scheduled), so
the frontend reads it directly from `GET /api/subscriptions/me`.

- `id`, `targetProduct` (`SubscriptionProduct`)
- `effectiveType` — `IMMEDIATE | ON_DATE | NEXT_BILLING_CYCLE | NEXT_BILLING_CYCLE_AFTER_DATE`
  (frontend currently only sends `NEXT_BILLING_CYCLE`)
- `effectiveDate` (required for `ON_DATE` / `NEXT_BILLING_CYCLE_AFTER_DATE`)
- `status` — `PENDING | APPLIED | CANCELLED`
- `createdAt`

### UserSetting

A single key/value preference for a `User`. Owned by the user-settings
service.

- `key` — matches a backend `SettingKey` enum constant (e.g. `THEME`,
  `DEFAULT_CURRENCY`, `BUDGET_ALERT_THRESHOLD_PERCENTAGE`,
  `NOTIFICATIONS_EMAIL_ENABLED`)
- `value` — current string value (falls back to `defaultValue` if unset)
- `defaultValue` — declared default for resets
- `valueType` — `BOOLEAN | INTEGER | DECIMAL | STRING | ENUM`
- `allowedValues` — non-empty for `BOOLEAN` and `ENUM`; empty for the
  free-form types

The backend always returns every known key; the frontend keeps its own
allow-list (`KNOWN_SETTING_KEYS` in `src/api/settings.js`, currently
empty) and silently ignores keys it doesn't yet render so the backend can
roll out new settings before UI for them ships.

### User

- `id`
- `displayName`
- `email`
- `defaultCurrency` (e.g. `"USD"`)

### Group

A named collection of users that share expenses (roommates, a trip, a
recurring split). Owned by the group-management service.

- `id`
- `name`, `description`
- `ownerId` — exactly one owner per group, **fixed for the lifetime of
  the group**. Ownership cannot be transferred and there is no concept
  of co-owners. To step away, the owner must delete the group.
- `createdAt`, `updatedAt`

### GroupMember

A user's membership in a `Group`. The group-management service models
re-joins as new active rows rather than mutating an old one.

- `id`, `groupId`, `userId`
- `role` — `OWNER | MEMBER`. Exactly one `OWNER` row per group.
- `status` — `ACTIVE | LEFT | REMOVED`
- `joinedAt`, `updatedAt`

The frontend lists active members via `GET /api/groups/{id}/members` and
hides the **Remove** action against the owner row to honor the
single-owner invariant. The backend currently allows any active member
to remove any other member (including the owner), so the rule is UI-only
today — see the changelog TODO for the matching server-side ask.

### GroupSetting

A single key/value preference for a `Group`. Owned by the
group-management service.

- `key` — matches a backend `GroupSettingKey` enum constant
- `value`, `defaultValue`, `valueType`, `allowedValues` — same shape as
  `UserSetting`

The backend always returns every known key; the frontend keeps its own
allow-list (`KNOWN_GROUP_SETTING_KEYS` in `src/api/groups.js`, currently
empty) and silently drops unknown keys via `pickKnownGroupSettings()`.

### Account (optional, future)

A bucket of money (checking, credit card, cash). Used to attribute transactions.

- `id`, `userId`, `name`, `type`

### Category

- `id`, `userId`, `name`, `color`, `icon`
- Categories are per-user.

### Budget

A spending limit for a category over a period.

- `id`, `userId`, `categoryId`
- `amount` (integer minor units)
- `period` (`"monthly"` initially)
- `startDate`

### Transaction

- `id`, `ownerId` (the user who recorded it)
- `amount` (integer minor units, positive = expense, negative = income)
- `currency`
- `date`
- `categoryId`
- `description`
- `accountId` (optional)
- `splitId` (nullable; set when this transaction is part of a split)

### Split

A shared expense between multiple users.

- `id`
- `creatorId`
- `totalAmount`, `currency`, `date`, `description`
- `method`: `"equal" | "shares" | "percent" | "exact"`
- `participants`: `[{ userId, share }]` where `share` is interpreted per
  `method`.
- For each participant, the system materializes a per-user `Transaction` for
  their share that flows into their own budget.

### Balance (derived)

For any pair of users (A, B), `balance(A, B)` = sum over splits where A paid
of B's share — sum over splits where B paid of A's share.

## Invariants

1. The sum of participants' computed shares in a split **must equal** the
   split's `totalAmount` exactly (in minor units).
2. A participant's share posts as a `Transaction` against their own budget in
   the corresponding category.
3. Editing a split must reissue the participant transactions atomically (no
   orphaned transactions).

