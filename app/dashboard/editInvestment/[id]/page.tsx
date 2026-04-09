'use client';
import type { Account } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function EditInvestment() {
    const params = useParams();
    const id = params.id;
    const router = useRouter();

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [accountId, setAccountId] = useState("");
    const [date, setDate] = useState(() => new Date().toLocaleDateString("en-CA"));
    const [purchasePrice, setPurchasePrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [name, setName] = useState("");

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
        if (!accountId || !date || !purchasePrice || !name || !quantity) return;

        try {
            await apiFetch(`/api/investments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId, date,
                    quantity: parseFloat(quantity),
                    purchasePrice: parseFloat(purchasePrice),
                    name,
                }),
            });
            router.back();
        } catch (error) {
            console.error("Error updating investment:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const [inv, accs] = await Promise.all([
                    apiFetch(`/api/investments/${id}`),
                    apiFetch("/api/accounts"),
                ]);
                const { accountId, date, quantity, name, purchasePrice } = inv.data;
                setAccountId(accountId);
                setDate(date);
                setQuantity(quantity.toString());
                setName(name);
                setPurchasePrice(purchasePrice.toString());
                setAccounts(accs.data);
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
                    <div className="skeleton h-8 w-44 mb-6" />
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

                <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Investment</h1>

                <form onSubmit={handleSubmit}>
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

                    <div className="mb-4">
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
                        Save Changes
                    </button>
                </form>
            </main>
        </div>
    );
}
