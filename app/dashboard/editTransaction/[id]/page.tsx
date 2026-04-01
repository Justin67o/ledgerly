'use client';
import type { Account } from "@/generated/prisma/client";
import type { Category } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";


export default function editTransaction() {
    // State for all accounts and categories of the user
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const params = useParams();
    const id = params.id; // <-- this is your transaction id

    // Controlled inputs
    const [accountId, setAccountId] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [date, setDate] = useState("");
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");
    // Handle amount

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;

        setAmount(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        // Check manual fill status
        const manuallyFilled = accountId && date && amount && name;

        // Validation: require either manual
        if (!manuallyFilled) {
            //alert("Please fill out all manual fields.");
            return;
        }

        // If there is manual input, use that, if not, use AI input
        // TODO: implement AI parsing logic to extract accountId, categoryId, date, and amount from aiInput
        const transactionData = { accountId, categoryId, date, amount: parseFloat(amount), name };

        try {
            const res = await apiFetch(`/api/transactions/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData)
            });
            setAccountId("");
            setCategoryId("");
            setDate("");
            setAmount("");
            setName("");
        }
        catch (error) {
            console.error("Error updating transaction:", error);

        }
    };

    useEffect(() => {

        const fetchdata = async () => {

            try {
                const transaction = await apiFetch(`/api/transactions/${id}`);
                const { accountId, categoryId, date, amount, description } = transaction.data;

                setAccountId(accountId);
                setCategoryId(categoryId ?? "");
                setDate(date);
                setAmount(amount.toString());
                setName(description);

                const fetchedAccounts = await apiFetch(`/api/accounts`);
                setAccounts(fetchedAccounts.data);

                const fetchedCategories = await apiFetch(`/api/categories`);
                setCategories(fetchedCategories.data);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Error fetching accounts or categories:", error);
                setIsLoading(false);
                return;
            }

        };

        fetchdata();
    }, []);

    return (
        <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
            <main className="max-w-5xl mx-auto px-4 md:px-8 pt-2">
                <div className="p-6 rounded-2xl mt-10" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
                    <form onSubmit={handleSubmit}>
                        <h1 className="text-xl font-semibold mb-4 text-center">Edit Transaction</h1>

                        {/* Manual Input Fields */}
                        <div className="mt-6">

                            {/* Name Input */}
                            <div className="mb-4">
                                <label htmlFor="amount" className="block text-lg font-medium mb-2">
                                    Name:
                                </label>
                                <input
                                    id="amount"
                                    type="string"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>
                            {/* Account Dropdown */}
                            <div className="mb-4">
                                <label htmlFor="account" className="block text-lg font-medium mb-2">
                                    Account:
                                </label>
                                <select
                                    id="account"
                                    value={accountId}
                                    onChange={(e) => setAccountId(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black"
                                >
                                    <option value="">Select an account</option>
                                    {accounts
                                        .filter(account => account.type !== "INVESTMENT")
                                        .map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Category Dropdown */}
                            <div className="mb-4">
                                <label htmlFor="category" className="block text-lg font-medium mb-2">
                                    Category:
                                </label>
                                <select
                                    id="category"
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black"
                                >
                                    <option value="">Select a category</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Input */}
                            <div className="mb-4">
                                <label htmlFor="date" className="block text-lg font-medium mb-2">
                                    Date:
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Amount Input */}
                            <div className="mb-4">
                                <label htmlFor="amount" className="block text-lg font-medium mb-2">
                                    Amount:
                                </label>
                                <input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    placeholder="Enter amount..."
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                                    style={{ backgroundColor: "var(--accent)", color: "#000" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                                >
                                    Save Transaction
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}