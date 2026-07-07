"use client";
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/currency";

export function IncomeExpenseChart({
  data,
  currency,
}: {
  data: { month: string; income: number; expense: number; savings: number }[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--positive))" stopOpacity={0.35} />
            <stop offset="100%" stopColor="hsl(var(--positive))" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
            <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} width={44} />
        <Tooltip
          formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
          contentStyle={{ borderRadius: 6, border: "1px solid hsl(var(--border))", fontSize: 13 }}
        />
        <Area type="monotone" dataKey="income" name="Income" stroke="hsl(var(--positive))" fill="url(#incomeFill)" strokeWidth={2} />
        <Area type="monotone" dataKey="expense" name="Expense" stroke="hsl(var(--destructive))" fill="url(#expenseFill)" strokeWidth={2} />
        <Line type="monotone" dataKey="savings" name="Savings" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
