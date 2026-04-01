'use client';
import type { Account } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function addInvestment() {
    // State for all accounts and categories of the user
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Controlled inputs
    const [aiInput, setAiInput] = useState("");
    const [accountId, setAccountId] = useState("");
    const [date, setDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0]; // "YYYY-MM-DD"
    });
    const [purchasePrice, setPurchasePrice] = useState("");
    const [quantity, setQuantity] = useState("");
    const [name, setName] = useState("");
    // Handle amount

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;

        setQuantity(value);
    };

    const handlePurchasePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;

        setPurchasePrice(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        // Check manual fill status
        const manuallyFilled = accountId && date && purchasePrice && name && quantity;
        // Check AI fill status
        const aiFilled = aiInput.trim() !== "";

        // Validation: require either manual or AI input
        if (!manuallyFilled && !aiFilled) {
            //alert("Please fill out either the AI input or all manual fields.");
            return;
        }

        // If there is manual input, use that, if not, use AI input
        // TODO: implement AI parsing logic to extract accountId, categoryId, date, and amount from aiInput
        const investmentData = manuallyFilled ? { accountId, date, quantity: parseFloat(quantity), purchasePrice: parseFloat(purchasePrice), name } : { aiInput };

        try {
            const res = await apiFetch("/api/investments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(investmentData)
            });
            setAiInput("");
            setAccountId("");
            setQuantity("");
            setDate("");
            setPurchasePrice("");
            setName("");
        }
        catch (error) {
            console.error("Error submitting investment:", error);

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
                console.error("Error fetching accounts: ", error);
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
                        <h1 className="text-xl font-semibold mb-4 text-center">Add Investment</h1>
                        {/* AI Input Field */}
                        <div>
                            <label htmlFor="aiInput" className="block text-xl font-medium mb-2 text-center">
                                AI Input:
                            </label>
                            <input
                                id="aiInput"
                                type="text"
                                placeholder="Type something..."
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />


                        </div>
                        <div className="flex items-center my-12">
                            <hr className="grow border-t border-gray-300" />
                            <span className="mx-2 text-gray-500 font-medium">OR</span>
                            <hr className="grow border-t border-gray-300" />
                        </div>
                        {/* Manual Input Fields */}
                        <div className="mt-6">
                            <p className="block text-xl font-medium mb-2 text-center">
                                Manual:
                            </p>

                            {/* Ticker Input */}
                            <div className="mb-4">
                                <label htmlFor="ticker" className="block text-lg font-medium mb-2">
                                    Ticker:
                                </label>
                                <input
                                    id="ticker"
                                    type="string"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter ticker..."
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
                                    <option value="" className="">Select an account</option>
                                    {accounts
                                        .filter(account => account.type === "INVESTMENT")
                                        .map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
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

                            {/* Purchase Price Input */}
                            <div className="mb-4">
                                <label htmlFor="purchasePrice" className="block text-lg font-medium mb-2">
                                    Purchase Price:
                                </label>
                                <input
                                    id="purchasePrice"
                                    type="number"
                                    value={purchasePrice}
                                    onChange={handlePurchasePriceChange}
                                    placeholder="Enter purchase price..."
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Quantity Input */}
                            <div className="mb-4">
                                <label htmlFor="quantity" className="block text-lg font-medium mb-2">
                                    Quantity:
                                </label>
                                <input
                                    id="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={handleQuantityChange}
                                    placeholder="Enter quantity..."
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
                                    Add Investment
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}