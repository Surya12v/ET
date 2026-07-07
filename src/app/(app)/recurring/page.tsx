"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Repeat } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { isDueThisPeriod } from "@/lib/recurring";
import type { Expense } from "@/lib/types";
import { toast } from "sonner";

export default function RecurringPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("expenses")
      .select("*, category:categories(*)")
      .not("recurrence_interval", "is", null)
      .order("expense_date", { ascending: false });
    setExpenses(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const templates = useMemo(() => expenses.filter((e) => !e.parent_recurring_id), [expenses]);
  const dueTemplates = useMemo(() => templates.filter((t) => isDueThisPeriod(t, expenses)), [templates, expenses]);

  async function generate(template: Expense) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
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

  async function generateAllDue() {
    setGenerating(true);
    let count = 0;
    for (const t of dueTemplates) {
      const ok = await generate(t);
      if (ok) count++;
    }
    setGenerating(false);
    toast.success(count > 0 ? `Generated ${count} expense(s) for this period` : "Nothing due right now");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {templates.length} recurring template{templates.length === 1 ? "" : "s"} · {dueTemplates.length} due this period
        </p>
        <Button onClick={generateAllDue} disabled={generating || dueTemplates.length === 0}>
          {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Generate due expenses
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      ) : templates.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">
          Mark an expense as recurring (in the Expenses tab) to see it here.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => {
            const due = isDueThisPeriod(t, expenses);
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
                  <div className="text-lg font-semibold">{formatCurrency(t.amount, t.currency)}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.category ? `${t.category.icon} ${t.category.name}` : "Uncategorized"} · started {t.expense_date}
                  </div>
                  <Button
                    size="sm"
                    variant={due ? "default" : "outline"}
                    disabled={!due}
                    onClick={async () => {
                      const ok = await generate(t);
                      if (ok) {
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
    </div>
  );
}
