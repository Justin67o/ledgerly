'use client'

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Account } from "@/generated/prisma/client";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

const TYPE_STYLES: Record<string, { bg: string; color: string }> = {
    CREDIT:     { bg: "#ff4d4d20", color: "#ff6b6b" },
    INVESTMENT: { bg: "var(--accent-dim)", color: "var(--accent)" },
    CHECKING:   { bg: "var(--bg-hover)", color: "var(--text-secondary)" },
    SAVINGS:    { bg: "#3b82f620", color: "#60a5fa" },
};

function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [liveBalances, setLiveBalances] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const router = useRouter();

    const handleDelete = async (accountId: string) => {
        try {
            await apiFetch(`/api/accounts/${accountId}`, { method: "DELETE" });
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        } catch (error) {
            console.error("Error deleting account:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const fetchedAccounts = await apiFetch("/api/accounts");
                const accs: Account[] = fetchedAccounts.data;
                setAccounts(accs);

                const investmentAccounts = accs.filter(a => a.type === "INVESTMENT");
                if (investmentAccounts.length > 0) {
                    const live: Record<string, number> = {};
                    await Promise.all(investmentAccounts.map(async (acc) => {
                        try {
                            const invs = await apiFetch(`/api/investments?accountId=${acc.id}`);
                            const holdings = invs.data;
                            const priceResults = await Promise.all(
                                holdings.map(async (inv: { name: string; quantity: string; purchasePrice: string }) => {
                                    try {
                                        const res = await apiFetch(`/api/investments/prices?ticker=${encodeURIComponent(inv.name)}`);
                                        return parseFloat(inv.quantity.toString()) * res.data;
                                    } catch {
                                        return parseFloat(inv.quantity.toString()) * parseFloat(inv.purchasePrice.toString());
                                    }
                                })
                            );
                            live[acc.id] = priceResults.reduce((s, v) => s + v, 0);
                        } catch {
                            live[acc.id] = parseFloat(acc.balance.toString());
                        }
                    }));
                    setLiveBalances(live);
                }

                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching accounts:", error);
                setIsLoading(false);
            }
        };
        fetchdata();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
                    <button
                        className="cursor-pointer px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                        onClick={() => router.push("/dashboard/addAccount")}
                    >
                        + Add Account
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl skeleton" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((account) => {
                            const typeStyle = TYPE_STYLES[account.type] ?? { bg: "var(--bg-hover)", color: "var(--text-secondary)" };
                            const balance = account.type === "INVESTMENT" && liveBalances[account.id] !== undefined
                                ? liveBalances[account.id]
                                : parseFloat(account.balance.toString());
                            return (
                                <div
                                    key={account.id}
                                    className="w-full p-4 rounded-2xl flex justify-between items-center cursor-pointer transition-all duration-150"
                                    style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
                                    onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
                                >
                                    <div>
                                        <p className="font-semibold">{account.name}</p>
                                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{account.dateCreated}</p>
                                        <p
                                            className="text-lg font-bold mt-1"
                                            style={{ color: balance >= 0 ? "var(--positive)" : "var(--negative)" }}
                                        >
                                            {formatCurrency(balance)}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3">
                                        <span
                                            className="px-2.5 py-0.5 text-xs font-semibold rounded-full"
                                            style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}
                                        >
                                            {account.type}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="p-2 rounded-lg transition-all duration-150"
                                                style={{ color: "var(--text-muted)" }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/editAccount/${account.id}`);
                                                }}
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-2 rounded-lg transition-all duration-150"
                                                style={{ color: "var(--negative)" }}
                                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ff4d4d18")}
                                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeletingAccount(account);
                                                }}
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <DeleteConfirmation
                            isOpen={!!deletingAccount}
                            onCancel={() => setDeletingAccount(null)}
                            onConfirm={() => {
                                if (deletingAccount) {
                                    handleDelete(deletingAccount.id);
                                    setDeletingAccount(null);
                                }
                            }}
                            itemName={`account "${deletingAccount?.name}"`}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
