"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/nav/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/nav/sidebar";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/expenses": "Expenses",
  "/categories": "Categories",
  "/budgets": "Budgets",
  "/recurring": "Recurring Expenses",
  "/settings": "Settings",
};

export function Topbar({ name, email, avatarUrl }: { name: string; email: string; avatarUrl?: string }) {
  const pathname = usePathname();
  const title = titles[pathname ?? ""] ?? "Expense Tracker";
  const initials = (name || email || "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-8">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarUrl} alt={name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">{name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action="/auth/signout" method="post">
              <button type="submit" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
