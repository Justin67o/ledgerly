'use client';
import type { Account } from "@/generated/prisma/client";
import type { Category } from "@/generated/prisma/client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function addTransaction() {
    // State for all accounts and categories of the user
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Controlled inputs
    const [aiInput, setAiInput] = useState("");
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
        const manuallyFilled = accountId && categoryId && date && amount && name;
        // Check AI fill status
        const aiFilled = aiInput.trim() !== "";

        // Validation: require either manual or AI input
        if(!manuallyFilled && !aiFilled){
            //alert("Please fill out either the AI input or all manual fields.");
            return;
        }
        
        // If there is manual input, use that, if not, use AI input
        // TODO: implement AI parsing logic to extract accountId, categoryId, date, and amount from aiInput
        const transactionData = manuallyFilled ? { accountId, categoryId, date, amount: parseFloat(amount), name } : { aiInput };

        try{
            const res = await apiFetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transactionData)
            });


            if(!res.ok){
                alert(`Error adding transaction`);
            }

                alert("Transaction added successfully!");
                setAiInput("");
                setAccountId("");
                setCategoryId("");
                setDate("");
                setAmount("");
                setName("");
        }
        catch(error){
            console.error("Error submitting transaction:", error);

        }
    };

    useEffect(() => {
        
        const fetchdata = async () => {
    
          try{
              const fetchedAccounts = await apiFetch("/api/accounts");
              setAccounts(fetchedAccounts.data);
              const fetchedCategories = await apiFetch("/api/categories");
              setCategories(fetchedCategories.data);
              setIsLoading(false);
          }
          catch(error){
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
                        <h1 className="text-xl font-semibold mb-4 text-center">Add Transaction</h1>
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
                                    <option value="" className="">Select an account</option>
                                    {accounts.map((account) => (
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
                                    Add Transaction
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}