"use client";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/currency";

export function CategoryPieChart({
  data,
  currency,
}: {
  data: { name: string; value: number; color: string }[];
  currency: string;
}) {
  if (data.length === 0) {
    return <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">No spending yet this month.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
