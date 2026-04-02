'use client';
import type { Account, Category } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";

export default function AddTransaction() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [aiInput, setAiInput] = useState("");
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");

    const router = useRouter();

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;
        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const manuallyFilled = accountId && date && amount && name;
        const aiFilled = aiInput.trim() !== "";
        if (!manuallyFilled && !aiFilled) return;

        const transactionData = manuallyFilled
            ? { accountId, categoryId, date, amount: parseFloat(amount), name }
            : { aiInput };

        try {
            await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData),
            });
            router.back();
        } catch (error) {
            console.error("Error submitting transaction:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const [accs, cats] = await Promise.all([
                    apiFetch("/api/accounts"),
                    apiFetch("/api/categories"),
                ]);
                setAccounts(accs.data);
                setCategories(cats.data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchdata();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-md mx-auto px-4 pt-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-1 text-sm mb-6 transition-colors duration-150"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                    <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <h1 className="text-2xl font-bold tracking-tight mb-6">Add Transaction</h1>

                <form onSubmit={handleSubmit}>
                    {/* AI Input */}
                    <div className="p-4 rounded-2xl mb-2" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
                            <span className="text-sm font-semibold">AI Input</span>
                            <span
                                className="text-xs px-1.5 py-0.5 rounded font-medium"
                                style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
                            >
                                Beta
                            </span>
                        </div>
                        <input
                            className="w-full"
                            id="aiInput"
                            type="text"
                            placeholder="e.g. Spent $45 on groceries at Loblaws today"
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                        />
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>or</span>
                        <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} />
                    </div>

                    {/* Manual fields */}
                    <div className="mb-4">
                        <label htmlFor="name" className="field-label">Name: </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Grocery Run"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="account" className="field-label">Account: </label>
                        <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">Select an account</option>
                            {accounts
                                .filter(a => a.type !== "INVESTMENT")
                                .map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="category" className="field-label">
                            Category: <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                        </label>
                        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">No category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="date" className="field-label">Date: </label>
                        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="amount" className="field-label">Amount: </label>
                        <input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0.00"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                    >
                        Add Transaction
                    </button>
                </form>
            </main>
        </div>
    );
}
