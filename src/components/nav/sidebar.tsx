"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Wallet2, Tags, PiggyBank, Repeat, LineChart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Income", icon: Wallet2 },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/trends", label: "Trends", icon: LineChart },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/budgets", label: "Budgets", icon: PiggyBank },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-sidebar-active/40 text-sidebar-active">
          <span className="font-serif text-base italic">L</span>
        </div>
        <span className="font-serif text-lg italic tracking-wide text-sidebar-foreground">Ledger</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-4">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
                active
                  ? "text-sidebar-active"
                  : "text-sidebar-muted hover:bg-white/5 hover:text-sidebar-foreground"
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 bg-sidebar-active transition-opacity",
                  active ? "opacity-100" : "opacity-0"
                )}
              />
              <Icon className="h-4 w-4" />
              <span className="ledger-caps text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="ledger-caps text-[10px] text-sidebar-muted">Private &amp; secure</p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border md:flex">
      <SidebarContent />
    </aside>
  );
}
