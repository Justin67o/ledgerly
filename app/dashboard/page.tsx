"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { Account, NetWorthSnapshot } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";
import AreaChartComponent from "@/src/components/areaChart";
import SimpleAreaChart from "@/src/components/areaChart";

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "All"];

const days = {
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "1Y": 365
};



function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState("1D");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [snapshots, setSnapshots] = useState<{ date: string; amount: number; createdAt: Date }[]>([]);
  const [hoveredData, setHoveredData] = useState<{ date: string; amount: number } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const netWorth = accounts.reduce((sum, a) => sum + parseFloat(a.balance.toString()), 0);

  const router = useRouter();

  useEffect(() => {

    const fetchdata = async () => {

      // clean up old snapshots so only the latest one for each date remains, this keeps the graph data clean and prevents it from getting bloated with multiple snapshots per day
      apiFetch("/api/snapshots/cleanup", { method: "POST" });

      try {
        const fetchedAccounts = await apiFetch("/api/accounts");
        setAccounts(fetchedAccounts.data);
        const fetchedSnapshots = await apiFetch("/api/snapshots");
        setSnapshots(fetchedSnapshots.data);
        console.log("Fetched snapshots:", fetchedSnapshots.data);
        setIsLoading(false);
      }
      catch (error) {
        console.error("Error fetching accounts:", error);
        setIsLoading(false);
        return;
      }

    };

    fetchdata();
  }, []);


  const filteredSnapshots = snapshots.filter(s => {
    if (timeframe === "All") return true;
    if (timeframe === "1D") {
      const now = new Date().toISOString().split("T")[0];
      console.log(new Date(s.date).toDateString(), new Date().toDateString());
      return s.date === now;
    }
    const snapshotDate = new Date(s.date);
    const now = new Date().toISOString().split("T")[0];
    const latest = new Date();
    latest.setDate(latest.getDate() - days[timeframe as keyof typeof days]);
    return s.date >= latest.toISOString().split("T")[0] && s.date <= now;
  });

  const latestPerDate: { [date: string]: { date: string; amount: number; createdAt: Date } } = {};

  filteredSnapshots.forEach(s => {
    latestPerDate[s.date] = s;
  });

  const finalSnapshots = Object.values(latestPerDate)

  const difference = timeframe !== "1D"
    ? finalSnapshots.length > 1 ? finalSnapshots[finalSnapshots.length - 1].amount - finalSnapshots[0].amount : 0
    : filteredSnapshots.length > 1 ? filteredSnapshots[filteredSnapshots.length - 1].amount - filteredSnapshots[0].amount : 0;
  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 md:pb-0" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <main className="max-w-5xl mx-auto px-4 md:px-8 pt-8">
          <div className="flex flex-col md:flex-row md:gap-8 mb-8">
            <div className="flex-1">
              <div className="skeleton h-4 w-20 mb-2" />
              <div className="skeleton h-12 w-56 mb-1" />
              <div className="skeleton h-4 w-32 mb-4" />
              <div className="skeleton h-48 w-full mb-4" />
              <div className="skeleton h-8 w-64 mx-auto" />
            </div>
            <div className="hidden md:flex flex-col gap-3 w-52 pt-14">
              <div className="skeleton h-11 w-full" />
              <div className="skeleton h-11 w-full" />
            </div>
          </div>
          <div className="skeleton h-5 w-24 mb-4" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20" />)}
          </div>
        </main>
      </div>
    );
  }

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
                {hoveredData ? formatCurrency(hoveredData.amount) : formatCurrency(netWorth)}
              </h1>
              <p className="text-sm mt-1" style={{ color: hoveredData ? "var(--text-secondary)" : difference >= 0 ? "var(--positive)" : "var(--negative)" }}>
                {hoveredData ?
                  `${hoveredData.date}` : `${difference >= 0 ? "+" : ""}${formatCurrency(difference)} (${((difference / (timeframe !== "1D" ? finalSnapshots[0]?.amount || netWorth : filteredSnapshots[0]?.amount || netWorth)) * 100).toFixed(2)}%)`}
              </p>
            </div>

            {/* Graph  */}
            <SimpleAreaChart data={timeframe !== "1D" ? finalSnapshots : filteredSnapshots} timeframe={timeframe} onHover={setHoveredData} />

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
              onClick={() => router.push("/dashboard/addInvestment")}
            >
              + Add Investment
            </button>
          </div>
        </div>

        {/* Account Summary Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold">Accounts</h2>
            <button className="cursor-pointer text-sm transition" style={{ color: "var(--accent)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-hover)")}
              onClick={() => router.push("/dashboard/accounts")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--accent)")}
            >
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
                onClick={() => router.push(`/dashboard/accounts/${account.id}`)}
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
