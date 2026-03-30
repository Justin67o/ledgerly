'use client';
import { useState, useEffect, act } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = ["Home", "Activity", "Accounts", "Budgets", "Investments"];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {

    
    const pathname = usePathname();

    return (
        <div>
            {/* Top Navigation DESKTOP ONLY*/}
        <nav
        className="sticky hidden md:block top-0 z-40 border-b px-4 md:px-8"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          {/* Logo */}
          <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
            Ledgerly
          </span>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item} href={item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
               style={{
                    backgroundColor: pathname === (item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`) ? "var(--bg-card)" : "transparent",
                    color: pathname === (item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`) ? "var(--text-primary)" : "var(--text-secondary)",
                  }}>
                  {item}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="fixed md:hidden max-w-5xl mx-auto flex justify-center left-0 right-0 h-9 py-2"
            style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}>
          {/* Logo - MOBILE*/}
          <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
            Ledgerly
          </span>
        </div>

        {children}

        
 {/* Sticky Bottom Bar — mobile only */}
          <div className="fixed bottom-0 left-0 right-0 md:hidden flex justify-center gap-1 border-t"
            style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}>
            {NAV_ITEMS.map((item) => (
              <Link key={item} href={item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`} className="px-2 py-5 rounded-lg text-xs font-medium transition-all duration-150"
                  style={{
                    backgroundColor: pathname === (item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`) ? "var(--bg-card)" : "transparent",
                    color: pathname === (item.toLowerCase() === "home" ? "/dashboard" : `/dashboard/${item.toLowerCase()}`) ? "var(--text-primary)" : "var(--text-secondary)",
                  }}>
                  {item}
                  
              </Link>
            ))}
          </div>


        




        
            
        </div>
    )
}