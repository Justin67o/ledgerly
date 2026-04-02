'use client';
import type { Account, Category } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function EditTransaction() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [transactionType, setTransactionType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
    const [date, setDate] = useState("");
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;
        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!accountId || !date || !amount || !name) return;

        try {
            await apiFetch(`/api/transactions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ accountId, categoryId, date, amount: parseFloat(amount), name, type: transactionType }),
            });
            router.back();
        } catch (error) {
            console.error("Error updating transaction:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const [tx, accs, cats] = await Promise.all([
                    apiFetch(`/api/transactions/${id}`),
                    apiFetch("/api/accounts"),
                    apiFetch("/api/categories"),
                ]);
                const { accountId, categoryId, date, amount, description, type } = tx.data;
                setAccountId(accountId);
                setCategoryId(categoryId ?? "");
                setTransactionType(type ?? "EXPENSE");
                setDate(date);
                setAmount(amount.toString());
                setName(description);
                setAccounts(accs.data);
                setCategories(cats.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setIsLoading(false);
            }
        };
        fetchdata();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen pb-24 md:pb-8" style={{ backgroundColor: "var(--bg-primary)" }}>
                <main className="max-w-md mx-auto px-4 pt-6">
                    <div className="skeleton h-4 w-12 mb-6" />
                    <div className="skeleton h-8 w-48 mb-6" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="mb-4">
                            <div className="skeleton h-3 w-20 mb-2" />
                            <div className="skeleton h-10 w-full" />
                        </div>
                    ))}
                    <div className="skeleton h-11 w-full mt-2" />
                </main>
            </div>
        );
    }

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

                <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Transaction</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="field-label">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Grocery Run"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="account" className="field-label">Account</label>
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
                            Category <span style={{ color: "var(--text-muted)", textTransform: "none", letterSpacing: 0 }}>(optional)</span>
                        </label>
                        <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">No category</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="field-label">Type</label>
                        <div className="flex gap-2 mt-1">
                            {(["EXPENSE", "INCOME"] as const).map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTransactionType(t)}
                                    className="px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-100"
                                    style={{
                                        backgroundColor: transactionType === t ? (t === "EXPENSE" ? "var(--negative)" : "var(--accent)") : "var(--bg-hover)",
                                        color: transactionType === t ? "#000" : "var(--text-muted)",
                                        border: "1px solid transparent",
                                    }}
                                >
                                    {t.charAt(0) + t.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="date" className="field-label">Date</label>
                        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="amount" className="field-label">Amount</label>
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
                        Save Changes
                    </button>
                </form>
            </main>
        </div>
    );
}
