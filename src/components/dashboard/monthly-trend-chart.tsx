"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/currency";

export function MonthlyTrendChart({ data, currency }: { data: { month: string; total: number }[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} width={40} />
        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
