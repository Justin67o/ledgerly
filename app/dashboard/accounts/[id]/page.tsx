"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Account, Prisma } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

type TransactionWithRelations = Prisma.TransactionGetPayload<{
    include: {
        account: true;
        category: true;
    };
}>;


const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"];


function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
    }).format(amount);
}

export default function AccountPage() {

    const params = useParams();
    const id = params.id; // <-- this is your account id

    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([]);

    const [account, setAccount] = useState<Account | null>(null);

    const [timeframe, setTimeframe] = useState("1M");

    const [isLoading, setIsLoading] = useState(true);

    const accountBalance = account ? parseFloat(account.balance.toString()) : 0;

    const router = useRouter();

    // state for delete confirmation modal
    const [confirmOpen, setConfirmOpen] = useState(false);
     
    // handle transaction deletion
    const handleDelete = async (transactionId: string) => {
        try {
            await apiFetch(`/api/transactions/${transactionId}`, {
                method: "DELETE"
            });
            // Remove the deleted transaction from the state
            setTransactions(transactions.filter(tx => tx.id !== transactionId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };



    useEffect(() => {

        const fetchdata = async () => {

            try {
                const fetchedAccount = await apiFetch(`/api/accounts/${id}`);
                setAccount(fetchedAccount.data);
                const fetchedTransactions = await apiFetch(`/api/transactions?accountId=${id}`);
                setTransactions(fetchedTransactions.data);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error fetching account:", error);
                setIsLoading(false);
                return;
            }

        };

        fetchdata();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>


            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">

                {/* Desktop: two-column layout — graph left, actions right */}
                <div className="flex flex-col md:flex-row md:gap-8 mb-8">

                    {/* Left: Net Worth + Graph + Timeframe */}
                    <div className="flex-1">
                        {/* Net Worth */}
                        <div className="mb-4">
                            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                                {account ? account.name : "Account"}
                            </p>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                {formatCurrency(accountBalance)}
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "var(--positive)" }}>
                                +$1,240.50 (5.1%) this month
                            </p>
                        </div>

                        {/* Graph Placeholder */}
                        <div
                            className="rounded-2xl flex items-center justify-center h-44 md:h-56 mb-4"
                            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-1">📈</div>
                                <p className="text-sm">Net worth graph coming soon</p>
                            </div>
                        </div>

                        {/* Timeframe Selector */}
                        <div className="flex justify-center">
                            <div
                                className="inline-flex left-0 right-0 rounded-xl p-1 gap-1"
                                style={{ backgroundColor: "var(--bg-card)" }}
                            >
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

                    {/* Right: Action Buttons — desktop only */}
                    <div className="hidden md:flex flex-col gap-3 w-52 pt-14">
                        <button
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                            style={{ backgroundColor: "var(--accent)", color: "#000" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                            onClick={() => router.push("/dashboard/addTransaction")}
                        >
                            + Add Transaction
                        </button>
                        <button
                            className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                            style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
                        >
                            + Add Investment
                        </button>
                    </div>
                </div>

                {/* Transactions */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-semibold mb-4 pt-4">Recent Activity</h1>
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
                                        {new Date(tx.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-lg font-bold" style={{ color: parseFloat(tx.amount.toString()) > 0 ? "var(--positive)" : "var(--negative)" }}>
                                        {parseFloat(tx.amount.toString()) > 0 ? "+ $" : "- $"}{Math.abs(parseFloat(tx.amount.toString())).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="px-2 py-0.5 text-lg rounded-full bg-blue-100 text-blue-800">
                                        {tx.category.name}
                                    </span>
                                    <button

                                        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-105"
                                        onClick={() => router.push(`/dashboard/editTransaction/${tx.id}`)}
                                    >
                                        <PencilIcon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                                    </button>
                                    <button

                                        className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-105"
                                        onClick={() => {setConfirmOpen(true)}}
                                    >
                                        <Trash2Icon className="w-5 h-5 text-red-800 dark:text-red-800" />
                                    </button>
                                    <DeleteConfirmation
                                        isOpen={confirmOpen}
                                        onCancel={() => setConfirmOpen(false)}
                                        onConfirm={() => handleDelete(tx.id)}
                                        itemName={`transaction "${tx.description}"`}
                                    />

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>


        </div>
    );
}
