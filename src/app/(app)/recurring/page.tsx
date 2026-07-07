"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/currency";
import { isExpenseDue, isIncomeDue } from "@/lib/recurring";
import type { Expense, Income } from "@/lib/types";
import { toast } from "sonner";

export default function RecurringPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: exp }, { data: inc }] = await Promise.all([
      supabase
        .from("expenses")
        .select("*, category:categories(*)")
        .not("recurrence_interval", "is", null)
        .order("expense_date", { ascending: false }),
      supabase
        .from("income")
        .select("*")
        .not("recurrence_interval", "is", null)
        .order("income_date", { ascending: false }),
    ]);
    setExpenses(exp ?? []);
    setIncome(inc ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const expenseTemplates = useMemo(() => expenses.filter((e) => !e.parent_recurring_id), [expenses]);
  const incomeTemplates = useMemo(() => income.filter((i) => !i.parent_recurring_id), [income]);
  const dueExpenseTemplates = useMemo(() => expenseTemplates.filter((t) => isExpenseDue(t, expenses)), [expenseTemplates, expenses]);
  const dueIncomeTemplates = useMemo(() => incomeTemplates.filter((t) => isIncomeDue(t, income)), [incomeTemplates, income]);

  async function generateExpense(template: Expense) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      category_id: template.category_id,
      amount: template.amount,
      currency: template.currency,
      description: template.description,
      merchant: template.merchant,
      payment_method: template.payment_method,
      expense_date: new Date().toISOString().slice(0, 10),
      is_recurring: true,
      recurrence_interval: template.recurrence_interval,
      parent_recurring_id: template.id,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }

  async function generateIncome(template: Income) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { error } = await supabase.from("income").insert({
      user_id: user.id,
      source: template.source,
      amount: template.amount,
      currency: template.currency,
      notes: template.notes,
      income_date: new Date().toISOString().slice(0, 10),
      is_recurring: true,
      recurrence_interval: template.recurrence_interval,
      parent_recurring_id: template.id,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }

  async function generateAllDue() {
    setGenerating(true);
    let count = 0;
    for (const t of dueExpenseTemplates) if (await generateExpense(t)) count++;
    for (const t of dueIncomeTemplates) if (await generateIncome(t)) count++;
    setGenerating(false);
    toast.success(count > 0 ? `Generated ${count} entr${count === 1 ? "y" : "ies"} for this period` : "Nothing due right now");
    load();
  }

  const totalDue = dueExpenseTemplates.length + dueIncomeTemplates.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {expenseTemplates.length + incomeTemplates.length} recurring template{expenseTemplates.length + incomeTemplates.length === 1 ? "" : "s"} · {totalDue} due this period
        </p>
        <Button onClick={generateAllDue} disabled={generating || totalDue === 0}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Generate all due
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : (
        <Tabs defaultValue="expenses">
          <TabsList>
            <TabsTrigger value="expenses">Expenses ({expenseTemplates.length})</TabsTrigger>
            <TabsTrigger value="income">Income ({incomeTemplates.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="expenses">
            {expenseTemplates.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Mark an expense as recurring (in the Expenses tab) to see it here.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {expenseTemplates.map((t) => {
                  const due = isExpenseDue(t, expenses);
                  return (
                    <Card key={t.id}>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            {t.merchant || t.description || "Recurring expense"}
                          </span>
                          <Badge variant="secondary">{t.recurrence_interval}</Badge>
                        </div>
                        <div className="tabular text-lg font-serif italic">{formatCurrency(t.amount, t.currency)}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.category ? `${t.category.icon} ${t.category.name}` : "Uncategorized"} · started {t.expense_date}
                        </div>
                        <Button
                          size="sm"
                          variant={due ? "default" : "outline"}
                          disabled={!due}
                          onClick={async () => {
                            if (await generateExpense(t)) {
                              toast.success("Generated this period's expense");
                              load();
                            }
                          }}
                        >
                          {due ? "Generate for this period" : "Already generated"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="income">
            {incomeTemplates.length === 0 ? (
              <p className="p-10 text-center text-sm text-muted-foreground">
                Mark income as recurring (e.g. your salary, in the Income tab) to see it here.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {incomeTemplates.map((t) => {
                  const due = isIncomeDue(t, income);
                  return (
                    <Card key={t.id}>
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Repeat className="h-4 w-4 text-muted-foreground" />
                            {t.source}
                          </span>
                          <Badge variant="secondary">{t.recurrence_interval}</Badge>
                        </div>
                        <div className="tabular text-lg font-serif italic text-positive">{formatCurrency(t.amount, t.currency)}</div>
                        <div className="text-xs text-muted-foreground">started {t.income_date}</div>
                        <Button
                          size="sm"
                          variant={due ? "default" : "outline"}
                          disabled={!due}
                          onClick={async () => {
                            if (await generateIncome(t)) {
                              toast.success("Generated this period's income");
                              load();
                            }
                          }}
                        >
                          {due ? "Generate for this period" : "Already generated"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
