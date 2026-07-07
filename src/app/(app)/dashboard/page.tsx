"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, PiggyBank, Repeat, TrendingUp, Wallet2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { IncomeExpenseChart } from "@/components/trends/income-expense-chart";
import { formatCurrency } from "@/lib/currency";
import { monthlySeries } from "@/lib/analytics";
import type { Budget, Expense, Income } from "@/lib/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 11);
      sixMonthsAgo.setDate(1);

      const [{ data: exp }, { data: inc }, { data: b }, { data: profile }] = await Promise.all([
        supabase
          .from("expenses")
          .select("*, category:categories(*)")
          .gte("expense_date", sixMonthsAgo.toISOString().slice(0, 10))
          .order("expense_date", { ascending: false }),
        supabase
          .from("income")
          .select("*")
          .gte("income_date", sixMonthsAgo.toISOString().slice(0, 10))
          .order("income_date", { ascending: false }),
        supabase.from("budgets").select("*, category:categories(*)"),
        supabase.from("profiles").select("default_currency").maybeSingle(),
      ]);
      setExpenses(exp ?? []);
      setIncome(inc ?? []);
      setBudgets(b ?? []);
      setCurrency(profile?.default_currency ?? "INR");
      setLoading(false);
    })();
  }, []);

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().slice(0, 10);

  const thisMonthExpenses = useMemo(() => expenses.filter((e) => e.expense_date >= monthStart), [expenses, monthStart]);
  const thisMonthIncome = useMemo(() => income.filter((i) => i.income_date >= monthStart), [income, monthStart]);
  const totalThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);
  const incomeThisMonth = thisMonthIncome.reduce((s, i) => s + i.amount, 0);
  const savingsThisMonth = incomeThisMonth - totalThisMonth;
  const recurringCount = expenses.filter((e) => e.is_recurring && !e.parent_recurring_id).length + income.filter((i) => i.is_recurring && !i.parent_recurring_id).length;

  const overallBudget = budgets.find((b) => !b.category_id);
  const budgetRemaining = overallBudget ? overallBudget.amount - totalThisMonth : null;

  const pieData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    for (const e of thisMonthExpenses) {
      const key = e.category?.name ?? "Uncategorized";
      const color = e.category?.color ?? "#8A8272";
      const existing = map.get(key);
      map.set(key, { name: key, color, value: (existing?.value ?? 0) + e.amount });
    }
    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [thisMonthExpenses]);

  const series = useMemo(() => monthlySeries(expenses, income, 6), [expenses, income]);

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Spent this month</CardTitle>
            <Wallet2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="tabular font-serif text-2xl italic">{formatCurrency(totalThisMonth, currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved this month</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={`tabular font-serif text-2xl italic ${savingsThisMonth < 0 ? "text-destructive" : "text-positive"}`}>
            {formatCurrency(savingsThisMonth, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top category</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="font-serif text-2xl italic">{topCategory ? topCategory.name : "—"}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurring entries</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="tabular font-serif text-2xl italic">{recurringCount}</CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="font-serif text-lg italic">Income vs expenses — 6 months</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/trends">Full trends →</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <IncomeExpenseChart data={series} currency={currency} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-lg italic">Spending by category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieData} currency={currency} />
          </CardContent>
        </Card>
      </div>

      {budgetRemaining !== null && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <span className="text-sm text-muted-foreground">Overall budget remaining this month</span>
            <span className={`tabular font-serif text-lg italic ${budgetRemaining < 0 ? "text-destructive" : "text-positive"}`}>
              {formatCurrency(budgetRemaining, currency)}
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
