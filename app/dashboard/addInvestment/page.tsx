'use client';
import type { Account } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import { ChevronLeft, Sparkles } from "lucide-react";

export default function AddInvestment() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [aiInput, setAiInput] = useState("");
    const [accountId, setAccountId] = useState("");
    const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [purchasePrice, setPurchasePrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [name, setName] = useState("");
    const router = useRouter();

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d*$/.test(value)) return;
        setQuantity(value);
    };

    const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;
        setPurchasePrice(value);
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const manuallyFilled = accountId && date && purchasePrice && name && quantity;
        const aiFilled = aiInput.trim() !== "";
        if (!manuallyFilled && !aiFilled) return;

        const investmentData = manuallyFilled
            ? { accountId, date, quantity: parseFloat(quantity), purchasePrice: parseFloat(purchasePrice), name }
            : { aiInput };

        const route = manuallyFilled ? "/api/investments" : "/api/ai/parse-investments";
        try {
            await apiFetch(route, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(investmentData),
            });
            router.back();
        } catch (error) {
            console.error("Error submitting investment:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const accs = await apiFetch("/api/accounts");
                setAccounts(accs.data);
            } catch (error) {
                console.error("Error fetching accounts:", error);
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

                <h1 className="text-2xl font-bold tracking-tight mb-6">Add Investment</h1>

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
                            placeholder="e.g. Bought 5 shares of AAPL at $195 today"
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

                    <div className="mb-4">
                        <label htmlFor="ticker" className="field-label">Ticker</label>
                        <input
                            id="ticker"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. AAPL"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="account" className="field-label">Account</label>
                        <select id="account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                            <option value="">Select an account</option>
                            {accounts
                                .filter(a => a.type === "INVESTMENT")
                                .map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="date" className="field-label">Purchase Date</label>
                        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="purchasePrice" className="field-label">Purchase Price per Unit</label>
                        <input
                            id="purchasePrice"
                            type="number"
                            value={purchasePrice}
                            onChange={handlePurchasePriceChange}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="quantity" className="field-label">Quantity</label>
                        <input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={handleQuantityChange}
                            placeholder="0"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{ backgroundColor: "var(--accent)", color: "#000" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                    >
                        Add Investment
                    </button>
                </form>
            </main>
        </div>
    );
}
