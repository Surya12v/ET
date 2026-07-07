"use client";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { percentChange } from "@/lib/analytics";
import type { PeriodTotals } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function Delta({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const change = percentChange(current, previous);
  const rounded = Math.round(change * 10) / 10;
  const isFlat = Math.abs(rounded) < 0.05;
  const isUp = rounded > 0;
  // For expenses, "up" is bad — invert the color semantics.
  const good = invert ? !isUp : isUp;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-medium tabular",
        isFlat ? "text-muted-foreground" : good ? "text-positive" : "text-destructive"
      )}
    >
      {isFlat ? <Minus className="h-3 w-3" /> : isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(rounded).toFixed(1)}%
    </span>
  );
}

export function ComparisonCard({
  title,
  currentLabel,
  previousLabel,
  current,
  previous,
  currency,
}: {
  title: string;
  currentLabel: string;
  previousLabel: string;
  current: PeriodTotals;
  previous: PeriodTotals;
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg italic">{title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {currentLabel} vs {previousLabel}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Income</span>
          <div className="flex items-center gap-2">
            <span className="tabular font-medium">{formatCurrency(current.income, currency)}</span>
            <Delta current={current.income} previous={previous.income} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Expenses</span>
          <div className="flex items-center gap-2">
            <span className="tabular font-medium">{formatCurrency(current.expense, currency)}</span>
            <Delta current={current.expense} previous={previous.expense} invert />
          </div>
        </div>
        <div className="ledger-hairline" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Savings</span>
          <div className="flex items-center gap-2">
            <span className={cn("tabular font-serif text-lg italic", current.savings < 0 ? "text-destructive" : "text-positive")}>
              {formatCurrency(current.savings, currency)}
            </span>
            <Delta current={current.savings} previous={previous.savings} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
