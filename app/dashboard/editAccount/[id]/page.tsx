'use client';
import { AccountType } from "@/generated/prisma/enums";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useParams } from "next/navigation";

export default function editAccount() {

    const [isLoading, setIsLoading] = useState(true);

    const types = Object.values(AccountType);

    const params = useParams();
    const id = params.id; // <-- this is your account id

    // Controlled inputs
    const [type, setType] = useState("");
    const [date, setDate] = useState("");
    const [balance, setBalance] = useState("");
    const [name, setName] = useState("");
    // Handle balance

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value
        if (!/^-?\d*\.?\d{0,2}$/.test(value)) return;

        setBalance(value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

        e.preventDefault();

        // Check manual fill status
        let manuallyFilled = type && balance && name && date;

        if (type === "INVESTMENT" && (balance === "" || isNaN(parseFloat(balance)))) {
            manuallyFilled = type && name;
        } else {
            manuallyFilled = type && balance && name && date;
        }

        // Validation: require either manual input
        if (!manuallyFilled) {
            return;
        }

        // If there is manual input, use that
        const accountData = { type, date, balance: parseFloat(balance), name };

        try {
            const res = await apiFetch(`/api/accounts/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(accountData)
            });


            setType("");
            setDate("");
            setBalance("");
            setName("");
        }
        catch (error) {
            console.error("Error submitting account:", error);

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
                        <h1 className="text-xl font-semibold mb-4 text-center">Edit Account</h1>

                        {/* Manual Input Fields */}
                        <div className="mt-6">

                            {/* Name Input */}
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-lg font-medium mb-2">
                                    Name:
                                </label>
                                <input
                                    id="name"
                                    type="string"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter name..."
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                />
                            </div>

                            {/* Type Dropdown */}
                            <div className="mb-4">
                                <label htmlFor="type" className="block text-lg font-medium mb-2">
                                    Type:
                                </label>
                                <select
                                    id="type"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-black"
                                >
                                    <option value="" className="">Select a type</option>
                                    {types.map((type) => (
                                        <option key={type} value={type}>
                                            {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Balance Input */}
                            {type !== "INVESTMENT" && (
                                <div className="mb-4">
                                    <label htmlFor="balance" className="block text-lg font-medium mb-2">
                                        Balance:
                                    </label>
                                    <input
                                        id="balance"
                                        type="number"
                                        value={balance}
                                        onChange={handleBalanceChange}
                                        placeholder="Enter balance..."
                                        className="w-full p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                            )}
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



                            {/* Submit Button */}
                            <div className="mt-6">
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                                    style={{ backgroundColor: "var(--accent)", color: "#000" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
                                >
                                    Save Account
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}