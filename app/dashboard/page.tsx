"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Account } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"];





function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("1M");
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0);

  const router = useRouter();
  
  useEffect(() => {
    
    const fetchdata = async () => {

      try{
          const fetchedAccounts = await apiFetch("/api/accounts");
          setAccounts(fetchedAccounts.data);
          setIsLoading(false);
      }
      catch(error){
        console.error("Error fetching accounts:", error);
        setIsLoading(false);
        return;
      }

    };

    fetchdata();
  }, []);

  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">

        {/* Desktop: two-column layout — graph left, actions right */}
        <div className="flex flex-col md:flex-row md:gap-8 mb-8">

          {/* Left: Net Worth + Graph + Timeframe */}
          <div className="flex-1">
            {/* Net Worth */}
            <div className="mb-4">
              <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                Net Worth
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {formatCurrency(netWorth)}
              </h1>
              <p className="text-sm mt-1" style={{ color: "var(--positive)" }}>
                +$1,240.50 (5.1%) this month
              </p>
            </div>

            {/* Graph Placeholder */}
            <div
              className="rounded-2xl flex items-center justify-center h-44 md:h-56 mb-4"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">📈</div>
                <p className="text-sm">Net worth graph coming soon</p>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex justify-center">
                <div
                  className="inline-flex left-0 right-0 rounded-xl p-1 gap-1"
                  style={{ backgroundColor: "var(--bg-card)" }}
                >
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className="px-3 py-1 rounded-lg text-sm font-medium transition-all duration-150"
                      style={{
                        backgroundColor: timeframe === tf ? "var(--bg-hover)" : "transparent",
                        color: timeframe === tf ? "var(--text-primary)" : "var(--text-muted)",
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div> 
            </div>

          {/* Right: Action Buttons — desktop only */}
          <div className="hidden md:flex flex-col gap-3 w-52 pt-14">
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: "var(--accent)", color: "#000" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--accent-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--accent)")}
              onClick={() => router.push("/dashboard/addTransaction")}
            >
              + Add Transaction
            </button>
            <button
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-150"
              style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
            >
              + Add Investment
            </button>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Accounts</h2>
            <button className="text-sm transition" style={{ color: "var(--accent)" }}>
              View all
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-4 rounded-2xl cursor-pointer transition-all duration-150"
                style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--bg-card)")}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">{account.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-dim)", color: "var(--accent)" }}
                  >
                    {account.type}
                  </span>
                </div>
                <p className="text-xl font-semibold">{formatCurrency(parseFloat(account.balance.toString()))}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

     
    </div>
  );
}
