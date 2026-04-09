'use client';
import { AccountType } from "@/generated/prisma/enums";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function AddAccount() {
    const types = Object.values(AccountType);
    const router = useRouter();

    const [type, setType] = useState("");
    const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [balance, setBalance] = useState("");
    const [name, setName] = useState("");

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;
        setBalance(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isInvestment = type === "INVESTMENT";
        const filled = isInvestment ? (type && name && date) : (type && balance && name && date);
        if (!filled) return;

        try {
            await apiFetch("/api/accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, date, balance: parseFloat(balance) || 0, name }),
            });
            router.back();
        } catch (error) {
            console.error("Error submitting account:", error);
        }
    };

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

                <h1 className="text-2xl font-bold tracking-tight mb-6">Add Account</h1>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name" className="field-label">Account Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. TD Chequing"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="type" className="field-label">Type</label>
                        <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
                            <option value="">Select a type</option>
                            {types.map((t) => (
                                <option key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}
                                </option>
                            ))}
                        </select>
                    </div>

                    {type !== "INVESTMENT" && (
                        <div className="mb-4">
                            <label htmlFor="balance" className="field-label">Starting Balance</label>
                            <input
                                id="balance"
                                type="number"
                                value={balance}
                                onChange={handleBalanceChange}
                                placeholder="0.00"
                            />
                        </div>
                    )}

                    <div className="mb-6">
                        <label htmlFor="date" className="field-label">Date Created</label>
                        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                    >
                        Add Account
                    </button>
                </form>
            </main>
        </div>
    );
}
