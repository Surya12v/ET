import Papa from "papaparse";
import type { Expense, Income } from "./types";

function downloadCsv(rows: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExpensesToCsv(expenses: Expense[], filename = "expenses.csv") {
  const rows = expenses.map((e) => ({
    Date: e.expense_date,
    Category: e.category?.name ?? "Uncategorized",
    Description: e.description ?? "",
    Merchant: e.merchant ?? "",
    "Payment Method": e.payment_method ?? "",
    Amount: e.amount,
    Currency: e.currency,
    Recurring: e.is_recurring ? "Yes" : "No",
  }));
  downloadCsv(rows, filename);
}

export function exportIncomeToCsv(income: Income[], filename = "income.csv") {
  const rows = income.map((i) => ({
    Date: i.income_date,
    Source: i.source,
    Notes: i.notes ?? "",
    Amount: i.amount,
    Currency: i.currency,
    Recurring: i.is_recurring ? "Yes" : "No",
  }));
  downloadCsv(rows, filename);
}
