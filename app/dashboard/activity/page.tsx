'use client'

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: {
        account: true;
        category: true;
    };
}>;

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function Activity() {
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
    const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithRelations | null>(null);

    const [isLoading, setIsLoading] = useState(true);
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
        const fetchdata = async () => {
            try {
                const fetchedTransactions = await apiFetch("/api/transactions");
                setTransactions(fetchedTransactions.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching transactions:", error);
                setIsLoading(false);
            }
        };
        fetchdata();
    }, []);

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

                {isLoading ? (
                    <div className="space-y-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-16 rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
                        <p className="text-sm">No transactions yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {transactions.map((tx) => {
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
