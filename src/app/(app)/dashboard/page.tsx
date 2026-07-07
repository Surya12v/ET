"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PiggyBank, Repeat, TrendingUp, Wallet } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { formatCurrency } from "@/lib/currency";
import type { Budget, Expense } from "@/lib/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const [{ data: exp }, { data: b }, { data: profile }] = await Promise.all([
        supabase
          .from("expenses")
          .select("*, category:categories(*)")
          .gte("expense_date", sixMonthsAgo.toISOString().slice(0, 10))
          .order("expense_date", { ascending: false }),
        supabase.from("budgets").select("*, category:categories(*)"),
        supabase.from("profiles").select("default_currency").maybeSingle(),
      ]);
      setExpenses(exp ?? []);
      setBudgets(b ?? []);
      setCurrency(profile?.default_currency ?? "INR");
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);

  const thisMonthExpenses = useMemo(() => expenses.filter((e) => e.expense_date >= monthStart), [expenses, monthStart]);
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const recurringCount = expenses.filter((e) => e.is_recurring && !e.parent_recurring_id).length;

  const overallBudget = budgets.find((b) => !b.category_id);
  const budgetRemaining = overallBudget ? overallBudget.amount - totalThisMonth : null;

  const pieData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    for (const e of thisMonthExpenses) {
      const key = e.category?.name ?? "Uncategorized";
      const color = e.category?.color ?? "#64748b";
      const existing = map.get(key);
      map.set(key, { name: key, color, value: (existing?.value ?? 0) + e.amount });
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [thisMonthExpenses]);

  const trendData = useMemo(() => {
    const months: { month: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString(undefined, { month: "short" });
      const monthKey = d.toISOString().slice(0, 7);
      const total = expenses.filter((e) => e.expense_date.startsWith(monthKey)).reduce((s, e) => s + e.amount, 0);
      months.push({ month: label, total: Math.round(total * 100) / 100 });
    }
    return months;
  }, [expenses, now]);

  const topCategory = pieData[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalThisMonth, currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{topCategory ? topCategory.name : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall budget left</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={`text-2xl font-bold ${budgetRemaining !== null && budgetRemaining < 0 ? "text-destructive" : ""}`}>
            {budgetRemaining !== null ? formatCurrency(budgetRemaining, currency) : "Not set"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurring expenses</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{recurringCount}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spending by category (this month)</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieData} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last 6 months</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={trendData} currency={currency} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
