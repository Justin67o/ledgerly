'use client'

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon, ChevronDownIcon } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: {
        account: true;
        category: true;
    };
}>;

type Category = { id: string; name: string; type: string };

type DateRange = "this_month" | "last_3_months" | "this_year" | "all_time";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
    this_month: "This Month",
    last_3_months: "Last 3 Months",
    this_year: "This Year",
    all_time: "All Time",
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

function isInDateRange(dateStr: string, range: DateRange): boolean {
    const txDate = new Date(dateStr);
    const now = new Date();
    if (range === "all_time") return true;
    if (range === "this_month") {
        return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    }
    if (range === "last_3_months") {
        const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        return txDate >= cutoff;
    }
    if (range === "this_year") {
        return txDate.getFullYear() === now.getFullYear();
    }
    return true;
}

export default function Activity() {
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithRelations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>("this_month");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

    const router = useRouter();

    const handleDeleteTransaction = async (transactionId: string) => {
        try {
            await apiFetch(`/api/transactions/${transactionId}`, { method: "DELETE" });
            setTransactions(transactions.filter(tx => tx.id !== transactionId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [txRes, catRes] = await Promise.all([
                    apiFetch("/api/transactions"),
                    apiFetch("/api/categories"),
                ]);
                setTransactions(txRes.data);
                setCategories(catRes.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const filtered = useMemo(() => {
        return transactions.filter(tx => {
            const inRange = isInDateRange(tx.date, dateRange);
            const inCategory = selectedCategory === "all" || tx.category?.id === selectedCategory;
            return inRange && inCategory;
        });
    }, [transactions, dateRange, selectedCategory]);

    const selectedCategoryName = selectedCategory === "all"
        ? "All Categories"
        : categories.find(c => c.id === selectedCategory)?.name ?? "All Categories";

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Recent Activity</h1>
                    <button
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                        onClick={() => router.push("/dashboard/addTransaction")}
                    >
                        + Add Transaction
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setDateRange(range)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                            style={{
                                backgroundColor: dateRange === range ? "var(--accent)" : "var(--bg-card)",
                                color: dateRange === range ? "#000" : "var(--text-secondary)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            {DATE_RANGE_LABELS[range]}
                        </button>
                    ))}

                    <div className="relative">
                        <button
                            onClick={() => setCategoryDropdownOpen(o => !o)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                            style={{
                                backgroundColor: selectedCategory !== "all" ? "var(--accent-dim)" : "var(--bg-card)",
                                color: selectedCategory !== "all" ? "var(--accent)" : "var(--text-secondary)",
                                border: "1px solid var(--border)",
                            }}
                        >
                            {selectedCategoryName}
                            <ChevronDownIcon className="w-3 h-3" />
                        </button>

                        {categoryDropdownOpen && (
                            <div
                                className="absolute left-0 top-full mt-1 z-20 min-w-[160px] rounded-xl overflow-hidden shadow-lg"
                                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                            >
                                {[{ id: "all", name: "All Categories" }, ...categories].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setCategoryDropdownOpen(false); }}
                                        className="w-full text-left px-3 py-2 text-xs transition-all duration-100"
                                        style={{
                                            color: selectedCategory === cat.id ? "var(--accent)" : "var(--text-primary)",
                                            backgroundColor: selectedCategory === cat.id ? "var(--accent-dim)" : "transparent",
                                        }}
                                        onMouseEnter={(e) => { if (selectedCategory !== cat.id) e.currentTarget.style.backgroundColor = "var(--bg-hover)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = selectedCategory === cat.id ? "var(--accent-dim)" : "transparent"; }}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                        {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
                    </span>
                </div>

                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                        <p className="text-sm">No transactions found</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((tx) => {
                            const amount = parseFloat(tx.amount.toString());
                            const isPositive = amount > 0;
                            return (
                                <div
                                    key={tx.id}
                                    className="p-4 rounded-2xl flex items-center justify-between gap-4"
                                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{tx.description}</p>
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{tx.date}</span>
                                            <span
                                                className="px-2 py-0.5 text-xs rounded-full"
                                                style={{ backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" }}
                                            >
                                                {tx.account.name}
                                            </span>
                                            {tx.category && (
                                                <span
                                                    className="px-2 py-0.5 text-xs rounded-full"
                                                    style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
                                                >
                                                    {tx.category.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p
                                        className="text-base font-semibold shrink-0"
                                        style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}
                                    >
                                        {isPositive ? "+" : "−"}{formatCurrency(Math.abs(amount))}
                                    </p>
                                    <button
                                        className="p-2 rounded-lg transition-all duration-150"
                                        style={{ color: "var(--text-muted)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                        onClick={() => router.push(`/dashboard/editTransaction/${tx.id}`)}
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        className="p-2 rounded-lg transition-all duration-150"
                                        style={{ color: "var(--negative)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4d18")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                        onClick={(e) => { e.stopPropagation(); setDeletingTransaction(tx); }}
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                    </button>
                                </div>
                            );
                        })}

                        <DeleteConfirmation
                            isOpen={!!deletingTransaction}
                            onCancel={() => setDeletingTransaction(null)}
                            onConfirm={() => {
                                if (deletingTransaction) {
                                    handleDeleteTransaction(deletingTransaction.id);
                                    setDeletingTransaction(null);
                                }
                            }}
                            itemName={`transaction "${deletingTransaction?.description}"`}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
