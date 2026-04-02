"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Account, Prisma } from "@/generated/prisma/client";
import { useRouter, useParams } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: { account: true; category: true };
}>;

type InvestmentWithRelations = Prisma.InvestmentGetPayload<{
    include: { account: true };
}>;

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"];

function mockGainPct(name: string): number {
    const seed = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return parseFloat((((seed % 45) - 15) + (seed % 7) * 0.3).toFixed(2));
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function AccountPage() {
    const params = useParams();
    const id = params.id;

    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
    const [investments, setInvestments] = useState<InvestmentWithRelations[]>([]);
    const [account, setAccount] = useState<Account | null>(null);
    const [timeframe, setTimeframe] = useState("1M");
    const [isLoading, setIsLoading] = useState(true);
    const [deletingTransaction, setDeletingTransaction] = useState<TransactionWithRelations | null>(null);
    const [deletingInvestment, setDeletingInvestment] = useState<InvestmentWithRelations | null>(null);

    const router = useRouter();
    const accountBalance = account ? parseFloat(account.balance.toString()) : 0;

    const handleDeleteTransaction = async (transactionId: string) => {
        try {
            await apiFetch(`/api/transactions/${transactionId}`, { method: "DELETE" });
            setTransactions(transactions.filter(tx => tx.id !== transactionId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };

    const handleDeleteInvestment = async (investmentId: string) => {
        try {
            await apiFetch(`/api/investments/${investmentId}`, { method: "DELETE" });
            setInvestments(investments.filter(inv => inv.id !== investmentId));
        } catch (error) {
            console.error("Error deleting investment:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const fetchedAccount = await apiFetch(`/api/accounts/${id}`);
                setAccount(fetchedAccount.data);

                if (fetchedAccount.data.type !== "INVESTMENT") {
                    const fetchedTransactions = await apiFetch(`/api/transactions?accountId=${id}`);
                    setTransactions(fetchedTransactions.data);
                } else {
                    const fetchedInvestments = await apiFetch(`/api/investments?accountId=${id}`);
                    setInvestments(fetchedInvestments.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching account:", error);
                setIsLoading(false);
            }
        };
        fetchdata();
    }, []);

    if (isLoading || !account) {
        return (
            <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)" }}>
                <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
                    <div className="skeleton h-4 w-24 mb-2" />
                    <div className="skeleton h-12 w-56 mb-1" />
                    <div className="skeleton h-4 w-32 mb-4" />
                    <div className="skeleton h-48 w-full mb-4" />
                    <div className="skeleton h-8 w-64 mx-auto mb-6" />
                    <div className="space-y-2">
                        {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">

                {/* Header row */}
                <div className="flex flex-col md:flex-row md:gap-8 mb-8">
                    <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                            {account.name}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            {formatCurrency(accountBalance)}
                        </h1>
                        <p className="text-sm mt-1" style={{ color: "var(--positive)" }}>
                            +$1,240.50 (5.1%) this month
                        </p>

                        {/* Graph Placeholder */}
                        <div
                            className="rounded-2xl flex items-center justify-center h-44 md:h-56 mb-4 mt-4"
                            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-1">📈</div>
                                <p className="text-sm">Graph coming soon</p>
                            </div>
                        </div>

                        {/* Timeframe Selector */}
                        <div className="flex justify-center">
                            <div className="inline-flex rounded-xl p-1 gap-1" style={{ backgroundColor: "var(--bg-card)" }}>
                                {TIMEFRAMES.map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setTimeframe(tf)}
                                        className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150"
                                        style={{
                                            backgroundColor: timeframe === tf ? "var(--bg-hover)" : "transparent",
                                            color: timeframe === tf ? "var(--text-primary)" : "var(--text-muted)",
                                        }}
                                    >
                                        {tf}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action buttons — desktop */}
                    <div className="hidden md:flex flex-col gap-3 w-52 pt-14">
                        <button
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                            style={{ backgroundColor: "var(--accent)", color: "#000" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                            onClick={() => router.push(
                                account.type === "INVESTMENT" ? "/dashboard/addInvestment" : "/dashboard/addTransaction"
                            )}
                        >
                            {account.type === "INVESTMENT" ? "+ Add Investment" : "+ Add Transaction"}
                        </button>
                    </div>
                </div>

                {/* Section heading */}
                <h2 className="text-base font-semibold mb-4">
                    {account.type !== "INVESTMENT" ? "Recent Activity" : "Holdings"}
                </h2>

                {/* Transactions list */}
                {account.type !== "INVESTMENT" ? (
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
                                    <div className="flex items-center gap-1 shrink-0">
                                        <p
                                            className="text-base font-semibold mr-2"
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
                ) : (
                    <div className="space-y-2">
                        {investments.map((inv) => {
                            const costBasis = parseFloat(inv.quantity.toString()) * parseFloat(inv.purchasePrice.toString());
                            const gainPct = mockGainPct(inv.name);
                            const currentValue = costBasis * (1 + gainPct / 100);
                            const isPositive = gainPct >= 0;
                            return (
                                <div
                                    key={inv.id}
                                    className="p-4 rounded-2xl flex items-center justify-between gap-4"
                                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{inv.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{inv.date}</p>
                                        <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                                            {inv.quantity.toString()} units @ {formatCurrency(parseFloat(inv.purchasePrice.toString()))}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className="text-right mr-2">
                                            <p className="text-base font-semibold" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>{formatCurrency(currentValue)}</p>
                                            <p className="text-xs font-medium" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                                                {isPositive ? "+" : ""}{gainPct}%
                                            </p>
                                        </div>
                                        <button
                                            className="p-2 rounded-lg transition-all duration-150"
                                            style={{ color: "var(--text-muted)" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                            onClick={() => router.push(`/dashboard/editInvestment/${inv.id}`)}
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg transition-all duration-150"
                                            style={{ color: "var(--negative)" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4d18")}
                                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                            onClick={(e) => { e.stopPropagation(); setDeletingInvestment(inv); }}
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        <DeleteConfirmation
                            isOpen={!!deletingInvestment}
                            onCancel={() => setDeletingInvestment(null)}
                            onConfirm={() => {
                                if (deletingInvestment) {
                                    handleDeleteInvestment(deletingInvestment.id);
                                    setDeletingInvestment(null);
                                }
                            }}
                            itemName={`investment "${deletingInvestment?.name}"`}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
