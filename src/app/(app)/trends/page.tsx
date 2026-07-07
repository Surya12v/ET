"use client";
import { useEffect, useMemo, useState } from "react";
import { Loader2, PiggyBank, TrendingDown, TrendingUp, Wallet2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IncomeExpenseChart } from "@/components/trends/income-expense-chart";
import { ComparisonCard } from "@/components/trends/comparison-card";
import { formatCurrency } from "@/lib/currency";
import { monthBounds, monthlySeries, periodTotals, yearBounds } from "@/lib/analytics";
import type { Expense, Income } from "@/lib/types";

export default function TrendsPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [currency, setCurrency] = useState("INR");
  const [loading, setLoading] = useState(true);

  const [rangeAFrom, setRangeAFrom] = useState("");
  const [rangeATo, setRangeATo] = useState("");
  const [rangeBFrom, setRangeBFrom] = useState("");
  const [rangeBTo, setRangeBTo] = useState("");
  const [customResult, setCustomResult] = useState<{ a: ReturnType<typeof periodTotals>; b: ReturnType<typeof periodTotals> } | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const [{ data: exp }, { data: inc }, { data: profile }] = await Promise.all([
        supabase.from("expenses").select("*, category:categories(*)").order("expense_date", { ascending: false }),
        supabase.from("income").select("*").order("income_date", { ascending: false }),
        supabase.from("profiles").select("default_currency").maybeSingle(),
      ]);
      setExpenses(exp ?? []);
      setIncome(inc ?? []);
      setCurrency(profile?.default_currency ?? "INR");
      setLoading(false);
    })();
  }, []);

  const thisMonth = monthBounds(0);
  const lastMonth = monthBounds(-1);
  const thisYear = yearBounds(0);
  const lastYear = yearBounds(-1);

  const thisMonthTotals = useMemo(() => periodTotals(expenses, income, thisMonth.start, thisMonth.end), [expenses, income, thisMonth]);
  const lastMonthTotals = useMemo(() => periodTotals(expenses, income, lastMonth.start, lastMonth.end), [expenses, income, lastMonth]);
  const thisYearTotals = useMemo(() => periodTotals(expenses, income, thisYear.start, thisYear.end), [expenses, income, thisYear]);
  const lastYearTotals = useMemo(() => periodTotals(expenses, income, lastYear.start, lastYear.end), [expenses, income, lastYear]);

  const allTimeSavings = useMemo(() => {
    const inc = income.reduce((s, i) => s + i.amount, 0);
    const exp = expenses.reduce((s, e) => s + e.amount, 0);
    return inc - exp;
  }, [expenses, income]);

  const series = useMemo(() => monthlySeries(expenses, income, 12), [expenses, income]);

  function runCustomComparison() {
    if (!rangeAFrom || !rangeATo || !rangeBFrom || !rangeBTo) return;
    setCustomResult({
      a: periodTotals(expenses, income, rangeAFrom, rangeATo),
      b: periodTotals(expenses, income, rangeBFrom, rangeBTo),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings this month</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={`tabular font-serif text-2xl italic ${thisMonthTotals.savings < 0 ? "text-destructive" : "text-positive"}`}>
            {formatCurrency(thisMonthTotals.savings, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Savings rate</CardTitle>
            {thisMonthTotals.savingsRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent className="tabular font-serif text-2xl italic">{thisMonthTotals.savingsRate.toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">All-time net savings</CardTitle>
            <Wallet2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className={`tabular font-serif text-2xl italic ${allTimeSavings < 0 ? "text-destructive" : "text-positive"}`}>
            {formatCurrency(allTimeSavings, currency)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg italic">Income, expenses &amp; savings — last 12 months</CardTitle>
        </CardHeader>
        <CardContent>
          <IncomeExpenseChart data={series} currency={currency} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ComparisonCard
          title="Month over month"
          currentLabel={thisMonth.label}
          previousLabel={lastMonth.label}
          current={thisMonthTotals}
          previous={lastMonthTotals}
          currency={currency}
        />
        <ComparisonCard
          title="Year over year"
          currentLabel={thisYear.label}
          previousLabel={lastYear.label}
          current={thisYearTotals}
          previous={lastYearTotals}
          currency={currency}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg italic">Compare custom date ranges</CardTitle>
          <p className="text-sm text-muted-foreground">Pick any two periods to compare — e.g. this quarter vs last, or a trip month vs average.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 rounded-md border p-3">
              <p className="ledger-caps text-xs font-medium text-muted-foreground">Range A</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={rangeAFrom} onChange={(e) => setRangeAFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={rangeATo} onChange={(e) => setRangeATo(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <p className="ledger-caps text-xs font-medium text-muted-foreground">Range B</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input type="date" value={rangeBFrom} onChange={(e) => setRangeBFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input type="date" value={rangeBTo} onChange={(e) => setRangeBTo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
          <Button
            onClick={runCustomComparison}
            disabled={!rangeAFrom || !rangeATo || !rangeBFrom || !rangeBTo}
          >
            Compare
          </Button>

          {customResult && (
            <ComparisonCard
              title="Custom comparison"
              currentLabel={`${rangeBFrom} → ${rangeBTo}`}
              previousLabel={`${rangeAFrom} → ${rangeATo}`}
              current={customResult.b}
              previous={customResult.a}
              currency={currency}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
