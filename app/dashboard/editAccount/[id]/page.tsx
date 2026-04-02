'use client';
import { AccountType } from "@/generated/prisma/enums";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function EditAccount() {
    const types = Object.values(AccountType);
    const params = useParams();
    const id = params.id;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    const [type, setType] = useState("");
    const [date, setDate] = useState("");
    const [balance, setBalance] = useState("");
    const [name, setName] = useState("");

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;
        setBalance(value);
    };

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        const isInvestment = type === "INVESTMENT";
        const filled = isInvestment ? (type && name) : (type && balance && name && date);
        if (!filled) return;

        try {
            await apiFetch(`/api/accounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, date, balance: parseFloat(balance) || 0, name }),
            });
            router.back();
        } catch (error) {
            console.error("Error updating account:", error);
        }
    };

    useEffect(() => {
        const fetchdata = async () => {
            try {
                const account = await apiFetch(`/api/accounts/${id}`);
                const { type, dateCreated, balance, name } = account.data;
                setType(type);
                setDate(dateCreated);
                setBalance(balance.toString());
                setName(name);
                setIsLoading(false);
            } catch (error) {
                console.error("Error fetching account:", error);
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
                    <div className="skeleton h-8 w-40 mb-6" />
                    {[...Array(4)].map((_, i) => (
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

                <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Account</h1>

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
                            <label htmlFor="balance" className="field-label">Balance</label>
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
                        Save Changes
                    </button>
                </form>
            </main>
        </div>
    );
}
