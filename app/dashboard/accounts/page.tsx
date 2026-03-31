'use client'

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Account } from "@/generated/prisma/client";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmation } from "@/src/components/deleteConfirmation";

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // state for the account being deleted (for delete confirmation modal)
    const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
    const router = useRouter();

    // Account colours for the account label
    const accountColors: Record<string, string> = {
        CREDIT: "bg-red-500 text-white",
        INVESTMENT: "bg-green-500 text-white",
        CHECKING: "bg-gray-200 text-gray-800",
        SAVINGS: "bg-blue-500 text-white",
    };

    // handle transaction deletion
    const handleDelete = async (accountId: string) => {
        try {
            await apiFetch(`/api/accounts/${accountId}`, {
                method: "DELETE"
            });
            // Remove the deleted transaction from the state
            setAccounts(accounts.filter(acc => acc.id !== accountId));
        } catch (error) {
            console.error("Error deleting transaction:", error);
        }
    };
    
    useEffect(() => {
        const fetchdata = async () => {
            try {
                const fetchedAccounts = await apiFetch("/api/accounts");
                setAccounts(fetchedAccounts.data);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error fetching accounts:", error);
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
                    <h1 className="text-2xl font-semibold mb-4 pt-4">Accounts</h1>
                    <button
                        className="cursor-pointer px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                        onClick={() => router.push("/dashboard/addAccount")}
                    >
                        + Add Account
                    </button>
                </div>

                {isLoading ? (
                    <p>Loading accounts...</p>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account) => (
                            <div
                                key={account.id}
                                className="w-full p-4 rounded-2xl flex justify-between 
                                            bg-(--bg-card) border border-(--border)
                                            text-left appearance-none focus:outline-none 
                                            hover:scale-105 transition-all duration-150
                                            cursor-pointer"
                                onClick={() => router.push(`/dashboard/accounts/${account.id}`)}>

                                <div>
                                    <p className="font-medium text-xl">{account.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {account.dateCreated}
                                    </p>
                                    <p className="text-lg font-bold" style={{ color: parseFloat(account.balance.toString()) >= 0 ? "var(--positive)" : "var(--negative)" }}>
                                        {parseFloat(account.balance.toString()) >= 0 ? "$" : "- $"}{Math.abs(parseFloat(account.balance.toString())).toFixed(2)}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <span className={`px-2 py-0.5 text-lg rounded-full ${accountColors[account.type] || "bg-gray-200 text-gray-800"}`}>
                                        {account.type}
                                    </span>
                                    <div>
                                        <button

                                            className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-105"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/dashboard/editAccount/${account.id}`);
                                            }}
                                        >
                                            <PencilIcon className="w-5 h-5 text-gray-800 dark:text-gray-200" />
                                        </button>
                                        <button
                                            type="button"
                                            className="relative p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform duration-150 hover:scale-105"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeletingAccount(account);
                                            }}
                                        >
                                            <Trash2Icon className="w-5 h-5 text-red-800 dark:text-red-800" />
                                        </button>

                                    </div>
                                </div>
                            </div>
                        ))}
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
