# Investment Snapshots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add historical value snapshots for individual investment accounts and for the aggregate portfolio, replacing the "graph coming soon" placeholders with real `SimpleAreaChart` charts.

**Architecture:** Two new Prisma models (`InvestmentAccountSnapshot` linked to `accountId`, `InvestmentSnapshot` linked to `userId`) each get a utility function, two API routes (GET + cleanup POST), and are triggered fire-and-forget from all investment write routes. The two investment UI pages fetch and display snapshot data using the existing `SimpleAreaChart` component and the same timeframe-filter/deduplication pattern from the dashboard.

**Tech Stack:** Next.js 14 App Router, Prisma (PostgreSQL), `yahoo-finance2`, `recharts` (via `SimpleAreaChart` in `src/components/areaChart.tsx`)

---

## File Map

**Create:**
- `lib/investmentAccountSnapshot.ts` — utility to snapshot one investment account's value
- `lib/investmentSnapshot.ts` — utility to snapshot aggregate portfolio value
- `app/api/investment-account-snapshots/[accountId]/route.ts` — GET per-account snapshots
- `app/api/investment-account-snapshots/[accountId]/cleanup/route.ts` — POST dedup past-date snapshots
- `app/api/investment-snapshots/route.ts` — GET aggregate snapshots
- `app/api/investment-snapshots/cleanup/route.ts` — POST dedup past-date snapshots

**Modify:**
- `prisma/schema.prisma` — add 2 models + relation fields on `Account` and `User`
- `app/api/investments/route.ts` — call both snapshot utilities in POST
- `app/api/investments/[id]/route.ts` — call both snapshot utilities in PUT and DELETE
- `app/api/ai/parse-investments/route.ts` — call both snapshot utilities in POST
- `app/dashboard/investments/page.tsx` — fetch aggregate snapshots and render chart
- `app/dashboard/accounts/[id]/page.tsx` — fetch per-account snapshots and render chart

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add two new models and relation fields**

In `prisma/schema.prisma`, add after the `NetWorthSnapshot` model (line 95):

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

Also add relation fields to existing models:

In the `Account` model (after `investments  Investment[]`), add:
```prisma
  investmentAccountSnapshots InvestmentAccountSnapshot[]
```

In the `User` model (after `snapshots   NetWorthSnapshot[]`), add:
```prisma
  investmentSnapshots InvestmentSnapshot[]
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add_investment_snapshots
```

Expected: Migration created and applied. Prisma client regenerated automatically.

- [ ] **Step 3: Verify Prisma client has new types**

```bash
npx prisma generate
```

Expected: "Generated Prisma Client" with no errors. You should now be able to import `InvestmentAccountSnapshot` and `InvestmentSnapshot` from `@/generated/prisma/client`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add InvestmentAccountSnapshot and InvestmentSnapshot prisma models"
```

---

## Task 2: Utility — Per-Account Snapshot

**Files:**
- Create: `lib/investmentAccountSnapshot.ts`

- [ ] **Step 1: Create the file**

```typescript
import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function createInvestmentAccountSnapshot(accountId: string) {
  const holdings = await prisma.investment.findMany({ where: { accountId } });

  let total = 0;
  for (const inv of holdings) {
    const qty = parseFloat(inv.quantity.toString());
    try {
      const result = await yahooFinance.quote(inv.name);
      const price = result?.regularMarketPrice ?? parseFloat(inv.purchasePrice.toString());
      total += qty * price;
    } catch {
      total += qty * parseFloat(inv.purchasePrice.toString());
    }
  }

  const date = new Date().toISOString().split("T")[0];
  await prisma.investmentAccountSnapshot.create({
    data: { accountId, amount: new Prisma.Decimal(total), date },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/investmentAccountSnapshot.ts
git commit -m "feat: add createInvestmentAccountSnapshot utility"
```

---

## Task 3: Utility — Aggregate Portfolio Snapshot

**Files:**
- Create: `lib/investmentSnapshot.ts`

- [ ] **Step 1: Create the file**

```typescript
import { prisma } from "./prisma";
import { Prisma } from "@/generated/prisma/client";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export async function createInvestmentSnapshot(userId: string) {
  const accounts = await prisma.account.findMany({
    where: { userId, type: "INVESTMENT" },
  });

  let total = 0;
  for (const account of accounts) {
    const holdings = await prisma.investment.findMany({ where: { accountId: account.id } });
    for (const inv of holdings) {
      const qty = parseFloat(inv.quantity.toString());
      try {
        const result = await yahooFinance.quote(inv.name);
        const price = result?.regularMarketPrice ?? parseFloat(inv.purchasePrice.toString());
        total += qty * price;
      } catch {
        total += qty * parseFloat(inv.purchasePrice.toString());
      }
    }
  }

  const date = new Date().toISOString().split("T")[0];
  await prisma.investmentSnapshot.create({
    data: { userId, amount: new Prisma.Decimal(total), date },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/investmentSnapshot.ts
git commit -m "feat: add createInvestmentSnapshot utility"
```

---

## Task 4: API Routes — Per-Account Snapshots (GET + Cleanup)

**Files:**
- Create: `app/api/investment-account-snapshots/[accountId]/route.ts`
- Create: `app/api/investment-account-snapshots/[accountId]/cleanup/route.ts`

- [ ] **Step 1: Create the GET route**

Create `app/api/investment-account-snapshots/[accountId]/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { accountId } = await params;

  // Verify the account belongs to this user
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const snapshots = await prisma.investmentAccountSnapshot.findMany({
      where: { accountId },
      orderBy: { createdAt: "asc" },
    });

    const formatted = snapshots.map((s) => ({
      date: s.date,
      amount: parseFloat(s.amount.toString()),
      createdAt: s.createdAt,
    }));

    return NextResponse.json(
      { message: "Investment account snapshots retrieved successfully", data: formatted },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Error retrieving snapshots, ${error.message}` },
        { status: 500 }
      );
    }
  }
}
```

- [ ] **Step 2: Create the cleanup route**

Create `app/api/investment-account-snapshots/[accountId]/cleanup/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { accountId } = await params;

  // Verify the account belongs to this user
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account || account.userId !== user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const snapshots = await prisma.investmentAccountSnapshot.findMany({
    where: { accountId },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().split("T")[0];
  // Only deduplicate past dates — keep all of today's snapshots
  const pastSnapshots = snapshots.filter((s) => s.date < today);

  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const snapshot of pastSnapshots) {
    if (seen.has(snapshot.date)) {
      toDelete.push(snapshot.id);
    } else {
      seen.add(snapshot.date);
    }
  }

  if (toDelete.length > 0) {
    await prisma.investmentAccountSnapshot.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return NextResponse.json({ message: "Cleanup complete" });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/investment-account-snapshots/
git commit -m "feat: add investment account snapshot GET and cleanup API routes"
```

---

## Task 5: API Routes — Aggregate Investment Snapshots (GET + Cleanup)

**Files:**
- Create: `app/api/investment-snapshots/route.ts`
- Create: `app/api/investment-snapshots/cleanup/route.ts`

- [ ] **Step 1: Create the GET route**

Create `app/api/investment-snapshots/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function GET(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const snapshots = await prisma.investmentSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const formatted = snapshots.map((s) => ({
      date: s.date,
      amount: parseFloat(s.amount.toString()),
      createdAt: s.createdAt,
    }));

    return NextResponse.json(
      { message: "Investment snapshots retrieved successfully", data: formatted },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Error retrieving snapshots, ${error.message}` },
        { status: 500 }
      );
    }
  }
}
```

- [ ] **Step 2: Create the cleanup route**

Create `app/api/investment-snapshots/cleanup/route.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuthentication } from "@/lib/requireAuthentication";

export async function POST(request: Request) {
  const user = await requireAuthentication();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const snapshots = await prisma.investmentSnapshot.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const today = new Date().toISOString().split("T")[0];
  // Only deduplicate past dates — keep all of today's snapshots
  const pastSnapshots = snapshots.filter((s) => s.date < today);

  const seen = new Set<string>();
  const toDelete: string[] = [];

  for (const snapshot of pastSnapshots) {
    if (seen.has(snapshot.date)) {
      toDelete.push(snapshot.id);
    } else {
      seen.add(snapshot.date);
    }
  }

  if (toDelete.length > 0) {
    await prisma.investmentSnapshot.deleteMany({
      where: { id: { in: toDelete } },
    });
  }

  return NextResponse.json({ message: "Cleanup complete" });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/investment-snapshots/
git commit -m "feat: add aggregate investment snapshot GET and cleanup API routes"
```

---

## Task 6: Wire Up Snapshot Triggers in Investment Write Routes

**Files:**
- Modify: `app/api/investments/route.ts`
- Modify: `app/api/investments/[id]/route.ts`
- Modify: `app/api/ai/parse-investments/route.ts`

- [ ] **Step 1: Update `app/api/investments/route.ts` POST**

Add imports at the top of the file alongside the existing `createNetWorthSnapshot` import:

```typescript
import { createInvestmentAccountSnapshot } from '@/lib/investmentAccountSnapshot';
import { createInvestmentSnapshot } from '@/lib/investmentSnapshot';
```

After the existing `createNetWorthSnapshot(user.id);` call in the `POST` handler (line 75), add:

```typescript
createInvestmentAccountSnapshot(account.id);
createInvestmentSnapshot(user.id);
```

The end of the `try` block in `POST` should look like:

```typescript
    createNetWorthSnapshot(user.id);
    createInvestmentAccountSnapshot(account.id);
    createInvestmentSnapshot(user.id);

    console.log("Created investment:", investment);
    return NextResponse.json({ message: 'Investment created successfully', data: investment }, { status: 201 });
```

- [ ] **Step 2: Update `app/api/investments/[id]/route.ts` PUT and DELETE**

Add imports at the top alongside the existing `createNetWorthSnapshot` import:

```typescript
import { createInvestmentAccountSnapshot } from '@/lib/investmentAccountSnapshot';
import { createInvestmentSnapshot } from '@/lib/investmentSnapshot';
```

In the `PUT` handler, after `createNetWorthSnapshot(user.id);` (currently line 67), add:

```typescript
    createInvestmentAccountSnapshot(updatedInvestment.accountId);
    createInvestmentSnapshot(user.id);
```

In the `DELETE` handler, after `createNetWorthSnapshot(user.id);` (currently line 107), add:

```typescript
    createInvestmentAccountSnapshot(investment.account.id);
    createInvestmentSnapshot(user.id);
```

- [ ] **Step 3: Update `app/api/ai/parse-investments/route.ts`**

Add imports at the top alongside the existing `createNetWorthSnapshot` import:

```typescript
import { createInvestmentAccountSnapshot } from "@/lib/investmentAccountSnapshot";
import { createInvestmentSnapshot } from "@/lib/investmentSnapshot";
```

After `createNetWorthSnapshot(user.id);` (currently line 67), add:

```typescript
    createInvestmentAccountSnapshot(account.id);
    createInvestmentSnapshot(user.id);
```

- [ ] **Step 4: Commit**

```bash
git add app/api/investments/route.ts app/api/investments/[id]/route.ts app/api/ai/parse-investments/route.ts
git commit -m "feat: trigger investment snapshots on all investment write routes"
```

---

## Task 7: Wire Up Chart on General Investments Page

**Files:**
- Modify: `app/dashboard/investments/page.tsx`

- [ ] **Step 1: Add snapshot state and imports**

At the top of `app/dashboard/investments/page.tsx`, add the `SimpleAreaChart` import alongside existing imports:

```typescript
import SimpleAreaChart from "@/src/components/areaChart";
```

Inside the `Investments` component, add snapshot state after the existing `deletingInvestment` state:

```typescript
const [snapshots, setSnapshots] = useState<{ date: string; amount: number; createdAt: Date }[]>([]);
const [hoveredData, setHoveredData] = useState<{ date: string; amount: number } | null>(null);
```

Add the timeframe-filter constants after the existing `TIMEFRAMES` constant (at the top of the file):

```typescript
const days = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};
```

- [ ] **Step 2: Fetch snapshots in useEffect**

In the `fetchdata` function inside `useEffect`, add snapshot fetching and cleanup alongside the existing parallel fetches. Replace:

```typescript
const [accs, invs] = await Promise.all([
    apiFetch("/api/accounts"),
    apiFetch("/api/investments"),
]);
```

With:

```typescript
apiFetch("/api/investment-snapshots/cleanup", { method: "POST" });
const [accs, invs, snapshotRes] = await Promise.all([
    apiFetch("/api/accounts"),
    apiFetch("/api/investments"),
    apiFetch("/api/investment-snapshots"),
]);
```

Then after `setInvestments(invData);` add:

```typescript
setSnapshots(snapshotRes.data);
```

- [ ] **Step 3: Add snapshot filtering logic**

Add this computed section before the `if (isLoading)` block:

```typescript
const filteredSnapshots = snapshots.filter((s) => {
    if (timeframe === "All") return true;
    if (timeframe === "1D") {
        const now = new Date().toISOString().split("T")[0];
        return s.date === now;
    }
    const now = new Date().toISOString().split("T")[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days[timeframe as keyof typeof days]);
    return s.date >= cutoff.toISOString().split("T")[0] && s.date <= now;
});

const latestPerDate: { [date: string]: { date: string; amount: number; createdAt: Date } } = {};
filteredSnapshots.forEach((s) => { latestPerDate[s.date] = s; });
const finalSnapshots = Object.values(latestPerDate);
```

- [ ] **Step 4: Replace graph placeholder with real chart**

Find the graph placeholder block (the div with "Portfolio graph coming soon") and replace it entirely with:

```tsx
{/* Portfolio Chart */}
<div className="mb-4 mt-4">
    <SimpleAreaChart
        data={timeframe !== "1D" ? finalSnapshots : filteredSnapshots}
        timeframe={timeframe}
        onHover={setHoveredData}
    />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/investments/page.tsx
git commit -m "feat: display aggregate investment snapshot chart on investments page"
```

---

## Task 8: Wire Up Chart on Individual Investment Account Page

**Files:**
- Modify: `app/dashboard/accounts/[id]/page.tsx`

- [ ] **Step 1: Add snapshot state and imports**

At the top of `app/dashboard/accounts/[id]/page.tsx`, add:

```typescript
import SimpleAreaChart from "@/src/components/areaChart";
```

Inside the `AccountPage` component, add snapshot state after the existing `deletingInvestment` state:

```typescript
const [snapshots, setSnapshots] = useState<{ date: string; amount: number; createdAt: Date }[]>([]);
const [hoveredData, setHoveredData] = useState<{ date: string; amount: number } | null>(null);
```

Add the days map constant at the top of the file alongside `TIMEFRAMES`:

```typescript
const days = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};
```

- [ ] **Step 2: Fetch snapshots inside the INVESTMENT branch of useEffect**

Inside the `useEffect` `fetchdata` function, in the `else` branch where `fetchedAccount.data.type === "INVESTMENT"` (after `setPrices(priceMap);`), add:

```typescript
apiFetch(`/api/investment-account-snapshots/${id}/cleanup`, { method: "POST" });
const snapshotRes = await apiFetch(`/api/investment-account-snapshots/${id}`);
setSnapshots(snapshotRes.data);
```

- [ ] **Step 3: Add snapshot filtering logic**

Add this computed section before the `if (isLoading || !account)` block:

```typescript
const filteredSnapshots = snapshots.filter((s) => {
    if (timeframe === "All") return true;
    if (timeframe === "1D") {
        const now = new Date().toISOString().split("T")[0];
        return s.date === now;
    }
    const now = new Date().toISOString().split("T")[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days[timeframe as keyof typeof days]);
    return s.date >= cutoff.toISOString().split("T")[0] && s.date <= now;
});

const latestPerDate: { [date: string]: { date: string; amount: number; createdAt: Date } } = {};
filteredSnapshots.forEach((s) => { latestPerDate[s.date] = s; });
const finalSnapshots = Object.values(latestPerDate);
```

- [ ] **Step 4: Replace graph placeholder with real chart**

Find the investment graph placeholder block inside the `{account.type === "INVESTMENT" && (...)}` section (the div with "Graph coming soon") and replace it with:

```tsx
{/* Investment Account Chart */}
<div className="mb-4 mt-4">
    <SimpleAreaChart
        data={timeframe !== "1D" ? finalSnapshots : filteredSnapshots}
        timeframe={timeframe}
        onHover={setHoveredData}
    />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/accounts/[id]/page.tsx
git commit -m "feat: display per-account investment snapshot chart on account detail page"
```

---

## Task 9: Verify End-to-End

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 with no TypeScript or compilation errors.

- [ ] **Step 2: Trigger a snapshot by adding or editing an investment**

Navigate to the Add Investment page and add any investment. Check the terminal output — you should see no errors from the snapshot utilities. Then open Prisma Studio to confirm rows were created:

```bash
npx prisma studio
```

Expected: `InvestmentAccountSnapshot` and `InvestmentSnapshot` tables each have a new row with today's date.

- [ ] **Step 3: Verify the investments page chart**

Navigate to `/dashboard/investments`. The "Portfolio graph coming soon" placeholder should be replaced by a chart. With only one data point it will render as a flat line — this is correct.

- [ ] **Step 4: Verify the individual account page chart**

Navigate to `/dashboard/accounts/<any-investment-account-id>`. The "Graph coming soon" placeholder should be replaced by a chart. Same single flat-line behavior expected with one data point.

- [ ] **Step 5: Verify cleanup endpoints**

In the browser network tab or via curl, confirm that `POST /api/investment-snapshots/cleanup` and `POST /api/investment-account-snapshots/[accountId]/cleanup` return `{ "message": "Cleanup complete" }` with status 200.

- [ ] **Step 6: Verify timeframe selector works**

On both pages, click through timeframe options (1D, 1W, 1M, 3M, 1Y, All) and confirm the chart re-renders for each without errors.
