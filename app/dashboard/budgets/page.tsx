'use client'

const MOCK_GOALS = [
  { category: "Groceries",    spent: 420,  goal: 500  },
  { category: "Dining Out",   spent: 280,  goal: 200  },
  { category: "Transport",    spent: 95,   goal: 150  },
  { category: "Entertainment",spent: 180,  goal: 100  },
  { category: "Utilities",    spent: 130,  goal: 150  },
  { category: "Shopping",     spent: 310,  goal: 300  },
];

const totalSpent = MOCK_GOALS.reduce((s, g) => s + g.spent, 0);
const totalGoal  = MOCK_GOALS.reduce((s, g) => s + g.goal,  0);

function fmt(n: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD", minimumFractionDigits: 0,
  }).format(n);
}

function ProgressBar({ spent, goal }: { spent: number; goal: number }) {
  const pct     = Math.min((spent / goal) * 100, 100);
  const over    = spent > goal;
  const warning = !over && pct >= 80;
  const color   = over ? "var(--negative)" : warning ? "#f5a623" : "var(--accent)";

  return (
    <div className="mt-2">
      <div
        className="w-full h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--border)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function Budgets() {
  const overallPct     = Math.min((totalSpent / totalGoal) * 100, 100);
  const overallOver    = totalSpent > totalGoal;
  const overallColor   = overallOver ? "var(--negative)" : "var(--accent)";

  return (
    <div
      className="min-h-screen pb-24 md:pb-0"
      style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
    >
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">

        {/* Page title */}
        <h1 className="text-4xl font-bold tracking-tight mb-6">Goals</h1>

        <div className="flex flex-col md:flex-row md:gap-8">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* ── Overall ── */}
            <section className="mb-6">
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Overall
              </h2>

              <div
                className="p-5 rounded-2xl"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Total spent
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Budget&nbsp;
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {fmt(totalGoal)}
                    </span>
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span
                    className="text-3xl font-bold tracking-tight"
                    style={{ color: overallColor }}
                  >
                    {fmt(totalSpent)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {overallOver
                      ? `${fmt(totalSpent - totalGoal)} over`
                      : `${fmt(totalGoal - totalSpent)} remaining`}
                  </span>
                </div>

                {/* overall bar */}
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${overallPct}%`, backgroundColor: overallColor }}
                  />
                </div>

                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {overallPct.toFixed(0)}% of monthly budget used
                </p>
              </div>
            </section>

            {/* ── Categories ── */}
            <section>
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Categories
              </h2>

              <div className="space-y-3">
                {MOCK_GOALS.map(({ category, spent, goal }) => {
                  const over    = spent > goal;
                  const pct     = Math.min((spent / goal) * 100, 100);
                  const warning = !over && pct >= 80;
                  const labelColor = over
                    ? "var(--negative)"
                    : warning
                    ? "#f5a623"
                    : "var(--text-primary)";

                  return (
                    <div
                      key={category}
                      className="p-4 rounded-2xl"
                      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="text-right">
                          <span
                            className="text-sm font-semibold"
                            style={{ color: labelColor }}
                          >
                            {fmt(spent)}
                          </span>
                          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                            &nbsp;/ {fmt(goal)}
                          </span>
                        </div>
                      </div>

                      <ProgressBar spent={spent} goal={goal} />

                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {pct.toFixed(0)}% used
                        </span>
                        <span className="text-xs" style={{ color: over ? "var(--negative)" : "var(--text-muted)" }}>
                          {over
                            ? `${fmt(spent - goal)} over`
                            : `${fmt(goal - spent)} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* ── Right column: pie chart placeholder ── */}
          <div className="hidden md:flex flex-col items-center w-64 pt-10 shrink-0">
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4 self-start"
              style={{ color: "var(--text-muted)" }}
            >
              Spending
            </p>

            {/* Circle placeholder */}
            <div
              className="w-52 h-52 rounded-full flex items-center justify-center"
              style={{
                border: "2px dashed var(--border)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-1">🥧</div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Chart coming soon
                </p>
              </div>
            </div>

            {/* Legend placeholders */}
            <div className="mt-6 w-full space-y-2">
              {MOCK_GOALS.map(({ category }) => (
                <div key={category} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: "var(--border)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
