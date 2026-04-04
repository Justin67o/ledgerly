"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Account, Investment } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";
import SimpleAreaChart from "@/src/components/areaChart";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"];

const days = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365,
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function Investments() {
    const [timeframe, setTimeframe] = useState("1M");
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [deletingInvestment, setDeletingInvestment] = useState<Investment | null>(null);
    const [snapshots, setSnapshots] = useState<{ date: string; amount: number; createdAt: Date }[]>([]);
    const [hoveredData, setHoveredData] = useState<{ date: string; amount: number } | null>(null);
    const router = useRouter();

    const totalCurrentValue = investments.reduce((sum, inv) => {
        const qty = parseFloat(inv.quantity.toString());
        const price = prices[inv.name] ?? parseFloat(inv.purchasePrice.toString());
        return sum + qty * price;
    }, 0);
    const totalCostBasis = investments.reduce((sum, inv) =>
        sum + parseFloat(inv.quantity.toString()) * parseFloat(inv.purchasePrice.toString()), 0);
    const overallGain = parseFloat((totalCurrentValue - totalCostBasis).toFixed(2));
    const overallGainPct = totalCostBasis > 0 ? parseFloat(((overallGain / totalCostBasis) * 100).toFixed(2)) : 0;

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
                apiFetch("/api/investment-snapshots/cleanup", { method: "POST" });
                const [accs, invs, snapshotRes] = await Promise.all([
                    apiFetch("/api/accounts"),
                    apiFetch("/api/investments"),
                    apiFetch("/api/investment-snapshots"),
                ]);
                setAccounts(accs.data);
                const invData: Investment[] = invs.data;
                setInvestments(invData);
                setSnapshots(snapshotRes.data);

                const tickers = [...new Set(invData.map((inv) => inv.name))];
                const priceEntries = await Promise.all(
                    tickers.map(async (ticker) => {
                        try {
                            const res = await apiFetch(`/api/investments/prices?ticker=${encodeURIComponent(ticker)}`);
                            return [ticker, res.data] as [string, number];
                        } catch {
                            return [ticker, null] as [string, null];
                        }
                    })
                );
                const priceMap: Record<string, number> = {};
                for (const [ticker, price] of priceEntries) {
                    if (price !== null) priceMap[ticker] = price;
                }
                setPrices(priceMap);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            }
        };
        fetchdata();
    }, []);

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

    if (isLoading) {
        return (
            <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
                <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-8">
                    <div className="skeleton h-8 w-48 mb-2" />
                    <div className="skeleton h-12 w-64 mb-1" />
                    <div className="skeleton h-4 w-32 mb-6" />
                    <div className="skeleton h-48 w-full mb-6" />
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-8">
                        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}
                    </div>
                    <div className="space-y-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16" />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8 pb-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:gap-8 mb-8">
                    <div className="flex-1">
                        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Total Investments</p>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                            {formatCurrency(totalCurrentValue)}
                        </h1>
                        {investments.length > 0 && (() => {
                            const isPositive = overallGain >= 0;
                            return (
                                <p className="text-sm mt-1" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                                    {isPositive ? "+" : "−"}{formatCurrency(Math.abs(overallGain))} ({isPositive ? "+" : "-"}{Math.abs(overallGainPct).toFixed(2)}%) total return
                                </p>
                            );
                        })()}

                        {/* Portfolio Chart */}
                        <div className="mb-4 mt-4">
                            <SimpleAreaChart
                                data={timeframe !== "1D" ? finalSnapshots : filteredSnapshots}
                                timeframe={timeframe}
                                onHover={setHoveredData}
                            />
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
                            onClick={() => router.push("/dashboard/addInvestment")}
                        >
                            + Add Investment
                        </button>
                    </div>
                </div>

                {/* Investment account cards */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold">Accounts</h2>
                        <button
                            className="cursor-pointer text-sm transition"
                            style={{ color: "var(--accent)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
                            onClick={() => router.push("/dashboard/accounts")}
                        >
                            View all
                        </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        {accounts
                            .filter(a => a.type === "INVESTMENT")
                            .map((account) => (
                                <div
                                    key={account.id}
                                    className="p-4 rounded-2xl cursor-pointer transition-all duration-150"
                                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
                                    onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-medium">{account.name}</span>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
                                        >
                                            {account.type}
                                        </span>
                                    </div>
                                    <p className="text-xl font-semibold">{formatCurrency(parseFloat(account.balance.toString()))}</p>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Holdings list */}
                <div>
                    <h2 className="text-base font-semibold mb-4">Holdings</h2>
                    <div className="space-y-2">
                        {investments.map((inv) => {
                            const qty = parseFloat(inv.quantity.toString());
                            const purchasePrice = parseFloat(inv.purchasePrice.toString());
                            const costBasis = qty * purchasePrice;
                            const currentPrice = prices[inv.name] ?? purchasePrice;
                            const currentValue = qty * currentPrice;
                            const gain = parseFloat((currentValue - costBasis).toFixed(2));
                            const gainPct = costBasis > 0 ? parseFloat(((gain / costBasis) * 100).toFixed(2)) : 0;
                            const isPositive = gain >= 0;
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
                                            {inv.quantity.toString()} units @ {formatCurrency(purchasePrice)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <div className="text-right mr-2">
                                            <p className="text-base font-semibold" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>{formatCurrency(currentValue)}</p>
                                            <p className="text-xs font-medium" style={{ color: isPositive ? "var(--positive)" : "var(--negative)" }}>
                                                {isPositive ? "+" : "−"}{formatCurrency(Math.abs(gain))} ({isPositive ? "+" : "-"}{Math.abs(gainPct).toFixed(2)}%)
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
                    </div>
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
            </main>
        </div>
    );
}
