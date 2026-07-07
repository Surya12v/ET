import type { Expense, Income } from "./types";

export function sumAmount<T extends { amount: number }>(items: T[]) {
  return items.reduce((sum, i) => sum + i.amount, 0);
}

export function inRange<T>(items: T[], dateOf: (item: T) => string, from: string, to: string) {
  return items.filter((i) => {
    const d = dateOf(i);
    return d >= from && d <= to;
  });
}

export function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

export function monthBounds(offsetFromCurrent: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offsetFromCurrent, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offsetFromCurrent + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10), label: start.toLocaleString(undefined, { month: "long", year: "numeric" }) };
}

export function yearBounds(offsetFromCurrent: number) {
  const year = new Date().getFullYear() + offsetFromCurrent;
  return { start: `${year}-01-01`, end: `${year}-12-31`, label: `${year}` };
}

export interface PeriodTotals {
  income: number;
  expense: number;
  savings: number;
  savingsRate: number;
}

export function periodTotals(expenses: Expense[], income: Income[], from: string, to: string): PeriodTotals {
  const inc = sumAmount(inRange(income, (i) => i.income_date, from, to));
  const exp = sumAmount(inRange(expenses, (e) => e.expense_date, from, to));
  const savings = inc - exp;
  return { income: inc, expense: exp, savings, savingsRate: inc > 0 ? (savings / inc) * 100 : 0 };
}

export function monthlySeries(expenses: Expense[], income: Income[], months: number) {
  const now = new Date();
  const series: { key: string; month: string; income: number; expense: number; savings: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const inc = sumAmount(income.filter((x) => x.income_date.startsWith(key)));
    const exp = sumAmount(expenses.filter((x) => x.expense_date.startsWith(key)));
    series.push({
      key,
      month: d.toLocaleString(undefined, { month: "short" }),
      income: Math.round(inc * 100) / 100,
      expense: Math.round(exp * 100) / 100,
      savings: Math.round((inc - exp) * 100) / 100,
    });
  }
  return series;
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}
