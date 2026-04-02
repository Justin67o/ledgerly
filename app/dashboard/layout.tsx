'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, Wallet, Target, TrendingUp } from "lucide-react";

const NAV_ITEMS = [
  { label: "Home",        href: "/dashboard",             Icon: Home },
  { label: "Activity",    href: "/dashboard/activity",    Icon: Activity },
  { label: "Accounts",    href: "/dashboard/accounts",    Icon: Wallet },
  { label: "Budgets",     href: "/dashboard/budgets",     Icon: Target },
  { label: "Investments", href: "/dashboard/investments", Icon: TrendingUp },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      {/* Desktop top nav */}
      <nav
        className="sticky hidden md:block top-0 z-40 border-b px-4 md:px-8"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between h-14">
          <span className="text-lg font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
            Ledgerly
          </span>
          <div className="flex items-center gap-1">
            {NAV_ITEMS.map(({ label, href }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150"
                  style={{
                    backgroundColor: active ? "var(--bg-card)" : "transparent",
                    color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Mobile top header */}
      <div
        className="fixed md:hidden top-0 left-0 right-0 z-40 flex justify-center items-center h-11 border-b"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        <span className="text-base font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
          Ledgerly
        </span>
      </div>

      {/* Page content — push down on mobile so it clears the fixed header */}
      <div className="pt-11 md:pt-0">
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden flex justify-around border-t"
        style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border)" }}
      >
        {NAV_ITEMS.map(({ label, href, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className="flex flex-col items-center gap-0.5 py-2.5 px-3 transition-colors duration-150"
              style={{ color: active ? "var(--accent)" : "var(--text-muted)" }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
