'use client'

import { useState, useEffect } from "react";
import { ChevronDownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import SimplePieChart, { PIE_COLORS, PieSlice } from "@/src/components/piechart";

// Generate last 12 months for the dropdown
function generateMonths() {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: d.toLocaleString("en-CA", { month: "long", year: "numeric" }),
            month: d.getMonth() + 1,
            year: d.getFullYear(),
        });
    }
    return months;
}

const MONTHS = generateMonths();

type Category = { id: string; name: string; type: string };
type Goal = { id: string; categoryId: string; categoryName: string; categoryType: "EXPENSE" | "INCOME"; goalAmount: number; spent: number };
type Budget = { id: string; month: number; year: number; goals: Goal[] } | null;

function fmt(n: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency", currency: "CAD", minimumFractionDigits: 0,
    }).format(n);
}

function ProgressBar({ spent, goal }: { spent: number; goal: number }) {
    const pct = Math.min((spent / goal) * 100, 100);
    const over = spent > goal;
    const warning = !over && pct >= 80;
    const color = over ? "var(--negative)" : warning ? "#f5a623" : "var(--accent)";

    return (
        <div className="mt-2">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
        </div>
    );
}

export default function Budgets() {
    const [selectedMonth, setSelectedMonth] = useState(MONTHS[0]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [budget, setBudget] = useState<Budget>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // inline add form state
    const [adding, setAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [newCategoryType, setNewCategoryType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
    const [newGoal, setNewGoal] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // inline goal editing state
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editingGoalValue, setEditingGoalValue] = useState("");
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const isCurrentMonth = selectedMonth.month === MONTHS[0].month && selectedMonth.year === MONTHS[0].year;

    // Fetch EXPENSE categories once (used for autocomplete + deduplication)
    useEffect(() => {
        fetch("/api/categories")
            .then(r => r.json())
            .then(d => setCategories((d.data ?? []).filter((c: Category) => c.type === "EXPENSE")));
    }, []);

    // Fetch budget when selected month changes; auto-create for current month
    useEffect(() => {
        setLoading(true);
        setBudget(null);
        setAdding(false);

        const { month, year } = selectedMonth;
        const isCurrent = month === MONTHS[0].month && year === MONTHS[0].year;

        // get the budget for the month and parse the response 
        fetch(`/api/budgets?month=${month}&year=${year}`)
            .then(r => r.json())
            .then(async d => {
                // if there is a month, return
                if (d.data) { setBudget(d.data); return; }
                if (!isCurrent) { return; }
                // Auto-create for current month if one is not already created (carries forward previous month's goals)
                const res = await fetch("/api/budgets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ month, year }),
                });
                const created = await res.json();
                if (!created.data) return;
                // Map created goals into the shape the page expects (spent = 0)
                const goals = (created.data.goals ?? []).map((g: { id: string; categoryId: string; category: { name: string; type: "EXPENSE" | "INCOME" }; goalAmount: number }) => ({
                    id: g.id,
                    categoryId: g.categoryId,
                    categoryName: g.category.name,
                    categoryType: g.category.type,
                    goalAmount: Number(g.goalAmount),
                    spent: 0,
                }));
                setBudget({ id: created.data.id, month, year, goals });
            })
            .finally(() => setLoading(false));
    }, [selectedMonth]);

    const goals = budget?.goals ?? [];
    const goalsWithTarget = goals.filter(g => g.goalAmount > 0);
    const totalSpent = goalsWithTarget.reduce((s, g) => s + (g.categoryType === "EXPENSE" ? g.spent : 0), 0);
    const totalGoal = goalsWithTarget.reduce((s, g) => s + (g.categoryType === "EXPENSE" ? g.goalAmount : 0), 0);

    const incomeGoals = goals.filter(g => g.categoryType === "EXPENSE");
    const pieData: (PieSlice & { fill: string })[] = incomeGoals
        .filter(g => g.spent > 0 && g.goalAmount > 0)
        .map((g, i) => ({ name: g.categoryName, value: g.spent, fill: PIE_COLORS[i % PIE_COLORS.length] }));
    const overallPct = totalGoal > 0 ? Math.min((totalSpent / totalGoal) * 100, 100) : 0;
    const overallOver = totalSpent > totalGoal;
    const overallColor = overallOver ? "var(--negative)" : "var(--accent)";

    async function handleGoalDelete(goalId: string, categoryId: string) {
        // Delete the Category — schema cascades to BudgetGoal and sets transactions' categoryId to null
        await fetch(`/api/categories/${categoryId}`, { method: "DELETE" });
        // prev is the previous state right before we update it, keep previous state but change the goals to remove deleted goal
        setBudget(prev => prev ? { ...prev, goals: prev.goals.filter(g => g.id !== goalId) } : prev);
        // remove deleted category from previous categories array
        setCategories(prev => prev.filter(c => c.id !== categoryId));
        setConfirmDeleteId(null);
    }

    async function handleGoalSave(goalId: string) {
        const amount = editingGoalValue === "" ? 0 : parseFloat(editingGoalValue);
        setEditingGoalId(null);
        if (!budget) return;
        // sends put request to update goal
        const res = await fetch(`/api/budgets/${budget.id}/goals/${goalId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ goalAmount: amount }),
        });
        if (res.ok) {
            // update budget with new goal, look for the goal with g.id and if it is, then update the goal amount
            setBudget(prev => prev ? {
                ...prev,
                goals: prev.goals.map(g => g.id === goalId ? { ...g, goalAmount: amount } : g),
            } : prev);
        }
    }

    async function handleAddSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setSubmitting(true);

        try {
            let budgetId = budget?.id;

            // Create the budget first if it doesn't exist yet
            if (!budgetId) {
                const res = await fetch("/api/budgets", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ month: selectedMonth.month, year: selectedMonth.year }),
                });
                const d = await res.json();
                // set the current budget to be the newly created budget
                budgetId = d.data.id;
                setBudget({ id: budgetId!, month: selectedMonth.month, year: selectedMonth.year, goals: [] });
            }

            // Reuse existing category by name (case-insensitive), or create a new one
            const trimmed = newCategoryName.trim();
            let categoryId = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase())?.id;
            if (!categoryId) {
                const res = await fetch("/api/categories", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: trimmed, type: newCategoryType }),
                });
                const d = await res.json();
                categoryId = d.data.id;
                // setCategories to be same as previous, just with the updated data for categoryId
                setCategories(prev => [...prev, d.data]);
            }

            // create a new budget goal for the category
            const res = await fetch(`/api/budgets/${budgetId}/goals`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    categoryId,
                    goalAmount: newGoal === "" ? 0 : parseFloat(newGoal),
                }),
            });
            // store new created budgetGoal
            const d = await res.json();
            const saved = d.data;

            // setBudget to be previous state but with the new goal at the end, (if no previous state means goal doesn't exist so do nothing)
            setBudget(prev => prev ? {
                ...prev,
                goals: [...prev.goals, {
                    id: saved.id,
                    categoryId: saved.categoryId,
                    categoryName: saved.category.name,
                    categoryType: saved.category.type,
                    goalAmount: Number(saved.goalAmount),
                    spent: 0,
                }],
            } : prev);

            setNewCategoryName("");
            setNewCategoryType("EXPENSE");
            setNewGoal("");
            setAdding(false);
        } finally {
            setSubmitting(false);
        }
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
                            {selectedMonth.label}
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
                                {MONTHS.map((m) => (
                                    <button
                                        key={`${m.month}-${m.year}`}
                                        className="w-full text-left px-4 py-2.5 text-sm transition-all duration-100"
                                        style={{ color: m.label === selectedMonth.label ? "var(--accent)" : "var(--text-primary)", backgroundColor: "transparent" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                        onClick={() => { setSelectedMonth(m); setDropdownOpen(false); }}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
                    </div>
                ) : !budget && !isCurrentMonth ? (
                    /* Past month with no budget set */
                    <div className="flex flex-col items-center justify-center py-24 gap-2">
                        <p className="text-lg font-medium" style={{ color: "var(--text-muted)" }}>No budget for this month</p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row md:gap-8">

                        {/* ── Left column ── */}
                        <div className="flex-1 min-w-0">

                            {/* Overall — only show when there are goals with a set goal amount */}
                            {goals.some(g => g.goalAmount > 0) && (
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
                            )}

                            {/* Categories */}
                            <section>
                                <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
                                    Categories
                                </h2>

                                <div className="space-y-3">
                                    {goals.length === 0 && !adding && (
                                        <p className="text-sm pb-3" style={{ color: "var(--text-muted)" }}>
                                            No goals yet. Add a category to get started.
                                        </p>
                                    )}

                                    {goals.map(({ id, categoryId, categoryName, spent, goalAmount }) => {
                                        const isEditing = editingGoalId === id;

                                        function startEdit() {
                                            setEditingGoalId(id);
                                            setEditingGoalValue(goalAmount === 0 ? "" : String(goalAmount));
                                        }

                                        function GoalInput() {
                                            return (
                                                <input
                                                    type="number"
                                                    value={editingGoalValue}
                                                    onChange={(e) => setEditingGoalValue(e.target.value)}
                                                    onBlur={() => handleGoalSave(id)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") handleGoalSave(id); if (e.key === "Escape") setEditingGoalId(null); }}
                                                    autoFocus
                                                    placeholder="No goal"
                                                    className="w-24 text-right text-sm"
                                                    style={{ backgroundColor: "var(--bg-hover)", border: "1px solid var(--accent)", borderRadius: "6px", padding: "2px 6px", color: "var(--text-primary)", outline: "none" }}
                                                />
                                            );
                                        }

                                        if (goalAmount === 0) {
                                            return (
                                                <div key={id} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">{categoryName}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-semibold">{fmt(spent)}</span>
                                                            {isEditing ? <GoalInput /> : (
                                                                <span
                                                                    onClick={startEdit}
                                                                    className="text-xs px-2 py-0.5 rounded-full cursor-pointer"
                                                                    style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-muted)" }}
                                                                >
                                                                    No goal
                                                                </span>
                                                            )}
                                                            {confirmDeleteId === id ? (
                                                                <span className="flex items-center gap-1">
                                                                    <button onClick={() => handleGoalDelete(id, categoryId)} className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: "var(--negative)" }}>Delete</button>
                                                                    <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)" }}>Cancel</button>
                                                                </span>
                                                            ) : (
                                                                <button onClick={() => setConfirmDeleteId(id)} style={{ color: "var(--text-muted)" }} className="hover:text-red-400 transition-colors">
                                                                    <Trash2Icon className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        const over = spent > goalAmount;
                                        const pct = Math.min((spent / goalAmount) * 100, 100);
                                        const warning = !over && pct >= 80;
                                        const labelColor = over ? "var(--negative)" : warning ? "#f5a623" : "var(--text-primary)";

                                        return (
                                            <div key={id} className="p-4 rounded-2xl" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium">{categoryName}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold" style={{ color: labelColor }}>{fmt(spent)}</span>
                                                        {isEditing ? (
                                                            <span className="text-sm" style={{ color: "var(--text-muted)" }}>/ <GoalInput /></span>
                                                        ) : (
                                                            <span
                                                                onClick={startEdit}
                                                                className="text-sm cursor-pointer"
                                                                style={{ color: "var(--text-muted)" }}
                                                                title="Click to edit goal"
                                                            >
                                                                / {fmt(goalAmount)}
                                                            </span>
                                                        )}
                                                        {confirmDeleteId === id ? (
                                                            <span className="flex items-center gap-1">
                                                                <button onClick={() => handleGoalDelete(id, categoryId)} className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ color: "var(--negative)" }}>Delete</button>
                                                                <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-1.5 py-0.5 rounded" style={{ color: "var(--text-muted)" }}>Cancel</button>
                                                            </span>
                                                        ) : (
                                                            <button onClick={() => setConfirmDeleteId(id)} style={{ color: "var(--text-muted)" }} className="hover:text-red-400 transition-colors">
                                                                <Trash2Icon className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {!isEditing && (
                                                    <>
                                                        <ProgressBar spent={spent} goal={goalAmount} />
                                                        <div className="flex justify-between mt-1">
                                                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct.toFixed(0)}% used</span>
                                                            <span className="text-xs" style={{ color: over ? "var(--negative)" : "var(--text-muted)" }}>
                                                                {over ? `${fmt(spent - goalAmount)} over` : `${fmt(goalAmount - spent)} left`}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}

                                    {/* Inline add form — only for current month */}
                                    {isCurrentMonth && adding ? (
                                        <form
                                            onSubmit={handleAddSubmit}
                                            className="p-4 rounded-2xl"
                                            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--accent)", boxShadow: "0 0 0 1px var(--accent-dim)" }}
                                        >
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="flex-1">
                                                    <label className="field-label">Category</label>
                                                    <div className="flex gap-1 mb-2">
                                                        {(["EXPENSE", "INCOME"] as const).map(t => (
                                                            <button
                                                                key={t}
                                                                type="button"
                                                                onClick={() => setNewCategoryType(t)}
                                                                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-100"
                                                                style={{
                                                                    backgroundColor: newCategoryType === t ? (t === "EXPENSE" ? "var(--negative)" : "var(--accent)") : "var(--bg-hover)",
                                                                    color: newCategoryType === t ? "#000" : "var(--text-muted)",
                                                                    border: "1px solid transparent",
                                                                }}
                                                            >
                                                                {t.charAt(0) + t.slice(1).toLowerCase()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        list="category-suggestions"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="e.g. Groceries, Dining Out..."
                                                        autoFocus
                                                        required
                                                    />
                                                    <datalist id="category-suggestions">
                                                        {categories.filter(c => !goals.some(g => g.categoryId === c.id)).map(c => (
                                                            <option key={c.id} value={c.name} />
                                                        ))}
                                                    </datalist>
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
                                                    disabled={submitting}
                                                    className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150"
                                                    style={{ backgroundColor: "var(--accent)", color: "#000", opacity: submitting ? 0.6 : 1 }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                                                >
                                                    {submitting ? "Adding..." : "Add"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150"
                                                    style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}
                                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-secondary)")}
                                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                                    onClick={() => { setAdding(false); setNewCategoryName(""); setNewCategoryType("EXPENSE"); setNewGoal(""); }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : isCurrentMonth ? (
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
                                    ) : null}
                                </div>
                            </section>
                        </div>

                        {/* ── Pie chart ── */}
                        <div className="flex flex-col items-center w-64 pt-10 shrink-0">
                            <SimplePieChart isAnimationActive={false} data={pieData} />
                            <div className="mt-6 w-full space-y-2">
                                {pieData.map(({ name, fill }, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: fill }} />
                                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{name}</span>
                                    </div>
                                ))}
                                {pieData.length === 0 && (
                                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>No spending recorded yet</p>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    );
}
