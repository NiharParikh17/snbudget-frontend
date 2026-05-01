# Domain Model (draft)

> Initial sketch. Refine as features are designed and built.

## Entities

### User

- `id`
- `displayName`
- `email`
- `defaultCurrency` (e.g. `"USD"`)

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

