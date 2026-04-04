# Investment Snapshots Design

**Date:** 2026-04-04

## Overview

Add historical snapshot tracking for investment accounts, mirroring the existing `NetWorthSnapshot` pattern. Two new snapshot types:

1. **`InvestmentAccountSnapshot`** — tracks the total value of a single investment account over time. Displayed as a chart on individual investment account pages.
2. **`InvestmentSnapshot`** — tracks the aggregate value of all investment accounts for a user over time. Displayed as a chart on the general investments page.

Both store only `amount` + `date`, identical in shape to `NetWorthSnapshot`.

---

## Database Schema

Two new Prisma models added to `prisma/schema.prisma`:

```prisma
model InvestmentAccountSnapshot {
  id        String   @id @default(cuid())
  accountId String
  amount    Decimal
  createdAt DateTime @default(now())
  date      String
  account   Account  @relation(fields: [accountId], references: [id], onDelete: Cascade)
}

model InvestmentSnapshot {
  id        String   @id @default(cuid())
  userId    String
  amount    Decimal
  createdAt DateTime @default(now())
  date      String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

`Account` model gets an `investmentAccountSnapshots InvestmentAccountSnapshot[]` relation field.
`User` model gets an `investmentSnapshots InvestmentSnapshot[]` relation field.

---

## Utility Functions

### `lib/investmentAccountSnapshot.ts`

- Takes an `accountId`
- Fetches all investments for that account from the DB
- For each investment, fetches live price from Yahoo Finance (falls back to `purchasePrice` on error)
- Sums `quantity * price` across all holdings
- Writes one `InvestmentAccountSnapshot` record with today's date

### `lib/investmentSnapshot.ts`

- Takes a `userId`
- Fetches all `INVESTMENT`-type accounts for that user
- For each account, fetches all holdings and live prices (same Yahoo Finance logic)
- Sums total value across all investment accounts
- Writes one `InvestmentSnapshot` record with today's date

Both are called fire-and-forget (no `await`) from API routes.

---

## API Routes

### Per-account snapshots

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/investment-account-snapshots/[accountId]` | Returns all snapshots for a specific account, ordered by `createdAt` asc |
| POST | `/api/investment-account-snapshots/[accountId]/cleanup` | Deduplicates snapshots: keeps all of today's, keeps only the latest per date for past dates |

### Aggregate snapshots

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/investment-snapshots` | Returns all aggregate investment snapshots for the current user, ordered by `createdAt` asc |
| POST | `/api/investment-snapshots/cleanup` | Same cleanup logic as above |

All routes require authentication via `requireAuthentication()`.

**Cleanup logic:** Loop snapshots newest-to-oldest. For past dates only (not today), keep the first occurrence seen per date and delete all subsequent duplicates. Today's snapshots are all kept.

Response format matches existing snapshots route:
```json
{ "message": "...", "data": [{ "date": "YYYY-MM-DD", "amount": 12400.00, "createdAt": "..." }] }
```

---

## Trigger Points

Both utility functions are called (fire-and-forget) in the following routes whenever investment data changes:

| Route | Event | Snapshots triggered |
|-------|-------|---------------------|
| `POST /api/investments` | New investment added | `createInvestmentAccountSnapshot(accountId)` + `createInvestmentSnapshot(userId)` |
| `PUT /api/investments/[id]` | Investment updated | Same — look up `accountId` from the investment record |
| `DELETE /api/investments/[id]` | Investment deleted | Same |
| `POST /api/ai/parse-investments` | AI bulk investment import | Same for each investment created |

Account create/update/delete routes do **not** trigger investment snapshots (they already trigger `NetWorthSnapshot`).

---

## UI Display

### Individual investment account page (`app/dashboard/accounts/[id]/page.tsx`)

- When `account.type === "INVESTMENT"`:
  - Fetch `GET /api/investment-account-snapshots/[accountId]`
  - Call `POST /api/investment-account-snapshots/[accountId]/cleanup`
  - Apply the same timeframe filter logic (1D, 1W, 1M, 3M, 1Y, All) and latest-per-date deduplication used on the dashboard
  - Render `SimpleAreaChart` with the filtered snapshot data

### General investments page (`app/dashboard/investments/page.tsx`)

- Fetch `GET /api/investment-snapshots`
- Call `POST /api/investment-snapshots/cleanup`
- Apply same timeframe filter + deduplication logic
- Render `SimpleAreaChart` with the filtered snapshot data

Both charts use the existing `SimpleAreaChart` component with no modifications needed.
