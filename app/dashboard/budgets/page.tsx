'use client'

import { useState } from "react";
import { ChevronDownIcon, PlusIcon } from "lucide-react";

const MOCK_BUDGETS = [
  "April 2026",
  "March 2026",
  "February 2026",
  "January 2026",
];


type Goal = { category: string; spent: number; goal: number | null };

const INITIAL_GOALS: Goal[] = [
  { category: "Groceries",     spent: 420, goal: 500  },
  { category: "Dining Out",    spent: 280, goal: 200  },
  { category: "Transport",     spent: 95,  goal: 150  },
  { category: "Entertainment", spent: 180, goal: 100  },
  { category: "Utilities",     spent: 130, goal: 150  },
  { category: "Shopping",      spent: 310, goal: 300  },
];

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
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function Budgets() {
  const [selectedBudget, setSelectedBudget] = useState(MOCK_BUDGETS[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  // inline add form state
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newGoal, setNewGoal] = useState("");

  const goalsWithTarget = goals.filter(g => g.goal !== null);
  const totalSpent = goalsWithTarget.reduce((s, g) => s + g.spent, 0);
  const totalGoal  = goalsWithTarget.reduce((s, g) => s + (g.goal ?? 0), 0);
  const overallPct   = totalGoal > 0 ? Math.min((totalSpent / totalGoal) * 100, 100) : 0;
  const overallOver  = totalSpent > totalGoal;
  const overallColor = overallOver ? "var(--negative)" : "var(--accent)";

  function handleAddSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCategory) return;
    setGoals(prev => [...prev, {
      category: newCategory,
      spent: 0,
      goal: newGoal === "" ? null : parseFloat(newGoal),
    }]);
    setNewCategory("");
    setNewGoal("");
    setAdding(false);
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">

        {/* Page title row */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold tracking-tight">Goals</h1>

          {/* Budget period dropdown */}
          <div className="relative">
            <button
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150"
              style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
              onClick={() => setDropdownOpen((o) => !o)}
            >
              {selectedBudget}
              <ChevronDownIcon
                className="w-4 h-4 transition-transform duration-150"
                style={{ color: "var(--text-muted)", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-44 rounded-xl overflow-hidden z-10"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}
              >
                {MOCK_BUDGETS.map((b) => (
                  <button
                    key={b}
                    className="w-full text-left px-4 py-2.5 text-sm transition-all duration-100"
                    style={{ color: b === selectedBudget ? "var(--accent)" : "var(--text-primary)", backgroundColor: "transparent" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    onClick={() => { setSelectedBudget(b); setDropdownOpen(false); }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:gap-8">

          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">

            {/* Overall */}
            <section className="mb-6">
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Overall
              </h2>
              <div className="p-5 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Total spent</span>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    Budget&nbsp;
                    <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(totalGoal)}</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold tracking-tight" style={{ color: overallColor }}>
                    {fmt(totalSpent)}
                  </span>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {overallOver ? `${fmt(totalSpent - totalGoal)} over` : `${fmt(totalGoal - totalSpent)} remaining`}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${overallPct}%`, backgroundColor: overallColor }} />
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{overallPct.toFixed(0)}% of monthly budget used</p>
              </div>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                Categories
              </h2>

              <div className="space-y-3">
                {goals.map(({ category, spent, goal }) => {
                  if (goal === null) {
                    // No-goal row — just shows spending, no bar
                    return (
                      <div key={category} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">{fmt(spent)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}>
                              No goal
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const over    = spent > goal;
                  const pct     = Math.min((spent / goal) * 100, 100);
                  const warning = !over && pct >= 80;
                  const labelColor = over ? "var(--negative)" : warning ? "#f5a623" : "var(--text-primary)";

                  return (
                    <div key={category} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{category}</span>
                        <div className="text-right">
                          <span className="text-sm font-semibold" style={{ color: labelColor }}>{fmt(spent)}</span>
                          <span className="text-sm" style={{ color: "var(--text-muted)" }}>&nbsp;/ {fmt(goal)}</span>
                        </div>
                      </div>
                      <ProgressBar spent={spent} goal={goal} />
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% used</span>
                        <span className="text-xs" style={{ color: over ? "var(--negative)" : "var(--text-muted)" }}>
                          {over ? `${fmt(spent - goal)} over` : `${fmt(goal - spent)} left`}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Inline add form */}
                {adding ? (
                  <form
                    onSubmit={handleAddSubmit}
                    className="p-4 rounded-2xl"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--accent)", boxShadow: "0 0 0 1px var(--accent-dim)" }}
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label className="field-label">Category</label>
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g. Gym, Coffee..."
                          autoFocus
                        />
                      </div>
                      <div className="w-full sm:w-36">
                        <label className="field-label">Goal amount <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                        <input
                          type="number"
                          value={newGoal}
                          onChange={(e) => setNewGoal(e.target.value)}
                          placeholder="No goal"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                        style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-secondary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                        onClick={() => { setAdding(false); setNewCategory(""); setNewGoal(""); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="w-full p-4 rounded-2xl flex items-center gap-2 text-sm font-medium transition-all duration-150"
                    style={{ backgroundColor: "var(--bg-card)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent)";
                      e.currentTarget.style.color = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                    onClick={() => setAdding(true)}
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add category
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* ── Right column: pie chart placeholder ── */}
          <div className="hidden md:flex flex-col items-center w-64 pt-10 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-widest mb-4 self-start" style={{ color: "var(--text-muted)" }}>
              Spending
            </p>
            <div
              className="w-52 h-52 rounded-full flex items-center justify-center"
              style={{ border: "2px dashed var(--border)", backgroundColor: "var(--bg-card)" }}
            >
              <div className="text-center">
                <div className="text-3xl mb-1">🥧</div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Chart coming soon</p>
              </div>
            </div>
            <div className="mt-6 w-full space-y-2">
              {goals.map(({ category }) => (
                <div key={category} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{category}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
