'use client'

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Prisma } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: {
        account: true;
        category: true;
    };
}>;

export default function Activity() {
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const fetchedTransactions = await apiFetch("/api/transactions");
                setTransactions(fetchedTransactions.data);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error fetching transactions:", error);
                setIsLoading(false);
                return;
            }
        };

        fetchdata();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-semibold mb-4 pt-4">Recent Activity</h1>
                    <button
                        className="px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150 cursor-pointer"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                        onClick={() => router.push("/dashboard/addTransaction")}
                    >
                        + Add Transaction
                    </button>
                </div>

                {isLoading ? (
                    <p>Loading transactions...</p>
                ) : (
                    <div className="space-y-4">
                        {transactions.map((tx) => (
                            <div key={tx.id} className="p-4 rounded-2xl flex justify-between" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                                <div>
                                    <p className="font-medium text-xl">{tx.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {tx.date}
                                    </p>
                                    <p className="text-lg font-bold" style={{ color: parseFloat(tx.amount.toString()) > 0 ? "var(--positive)" : "var(--negative)" }}>
                                        {parseFloat(tx.amount.toString()) > 0 ? "+ $" : "- $"}{Math.abs(parseFloat(tx.amount.toString())).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <span className="px-2 py-0.5 text-lg rounded-full bg-gray-200 text-gray-800">
                                        {tx.account.name}
                                    </span>
                                    {tx.category && <span className="px-2 py-0.5 text-lg rounded-full bg-blue-100 text-blue-800">
                                        {tx.category.name}
                                    </span>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
