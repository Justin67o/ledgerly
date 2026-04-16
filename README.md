# Ledgerly

**A personal finance platform inspired by Wealthsimple.**

Ledgerly helps you track net worth, manage transactions, monitor budgets, and follow investment portfolios in real time — with natural language AI input powered by Google Gemini.

[Live Demo](https://ledgerly-wine.vercel.app) · [GitHub](https://github.com/justinchen/ledgerly)

![Dashboard](screenshots/dashboard.png)

---

## Features

- **Natural language transactions** — add expenses and income by typing plain English, parsed by the Gemini API into structured transaction records
- **Live investment tracking** — stocks, ETFs, and crypto prices pulled from Yahoo Finance, automatically updating portfolio value and net worth
- **Net worth graph** — interactive historical chart across configurable timeframes (1D to All), powered by a snapshot system that records net worth on every balance change
- **Budget tracking** — set monthly spending goals per category, tracked against actual transactions with visual breakdowns
- **Multiple account types** — checking, savings, credit, and investment accounts, each contributing to a unified net worth calculation
- **Secure auth** — NextAuth.js with JWT sessions and bcrypt password hashing

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS v4, Recharts |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL (Neon) |
| Auth | NextAuth.js, JWT, bcrypt |
| APIs | Google Gemini, Yahoo Finance |

---

## How the net worth graph works

Net worth is not computed on every page load. Instead a snapshot of the user's total net worth is recorded to the database every time any account balance changes. The graph renders from these snapshots, making historical data fast to query and accurate to the moment of each change.

![Net Worth Graph](screenshots/dashboard.png)

---

## Screenshots


![Budget](screenshots/budget.png)

---

## Running Locally

```bash
# Clone the repo
git clone https://github.com/justinchen/ledgerly.git
cd ledgerly

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, NEXTAUTH_SECRET, GEMINI_API_KEY

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

---

## License

MIT