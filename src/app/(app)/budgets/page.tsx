"use client";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { formatCurrency } from "@/lib/currency";
import type { Budget, Category, Expense } from "@/lib/types";
import { toast } from "sonner";

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { start, end };
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("INR");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { start, end } = monthRange();
    const [{ data: b }, { data: c }, { data: e }, { data: profile }] = await Promise.all([
      supabase.from("budgets").select("*, category:categories(*)").order("created_at"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("expenses").select("*").gte("expense_date", start).lte("expense_date", end),
      supabase.from("profiles").select("default_currency").maybeSingle(),
    ]);
    setBudgets(b ?? []);
    setCategories(c ?? []);
    setExpenses(e ?? []);
    setCurrency(profile?.default_currency ?? "INR");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const spendByCategory = useMemo(() => {
    const map = new Map<string | "overall", number>();
    let overall = 0;
    for (const e of expenses) {
      overall += e.amount;
      const key = e.category_id ?? "uncategorized";
      map.set(key, (map.get(key) ?? 0) + e.amount);
    }
    map.set("overall", overall);
    return map;
  }, [expenses]);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Budget removed");
    load();
  }

  const existingCategoryIds = budgets.filter((b) => b.category_id).map((b) => b.category_id as string);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <BudgetFormDialog categories={categories} existingCategoryIds={existingCategoryIds} onSaved={load} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : budgets.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">No budgets set yet. Add one to start tracking limits.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const spentKey = b.category_id ?? "overall";
            const spent = spendByCategory.get(spentKey) ?? 0;
            const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
            const over = spent > b.amount;
            return (
              <Card key={b.id}>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-serif text-lg italic">
                    {b.category ? `${b.category.icon} ${b.category.name}` : "Overall"}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline justify-between text-sm">
                    <span className={over ? "tabular font-semibold text-destructive" : "tabular font-semibold"}>
                      {formatCurrency(spent, currency)}
                    </span>
                    <span className="text-muted-foreground"> of {formatCurrency(b.amount, currency)}</span>
                  </div>
                  <Progress value={pct} indicatorClassName={over ? "bg-destructive" : undefined} />
                  {over && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
                      <AlertTriangle className="h-3.5 w-3.5" /> Over budget this month
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
