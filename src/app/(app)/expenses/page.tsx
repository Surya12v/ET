"use client";
import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Pencil, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog";
import { formatCurrency } from "@/lib/currency";
import { exportExpensesToCsv } from "@/lib/csv";
import type { Category, Expense } from "@/lib/types";
import { toast } from "sonner";

const ALL = "all";

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("INR");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: exp }, { data: cats }, { data: profile }] = await Promise.all([
      supabase.from("expenses").select("*, category:categories(*)").order("expense_date", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("profiles").select("default_currency").maybeSingle(),
    ]);
    setExpenses(exp ?? []);
    setCategories(cats ?? []);
    setDefaultCurrency(profile?.default_currency ?? "INR");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== ALL && e.category_id !== categoryFilter) return false;
      if (from && e.expense_date < from) return false;
      if (to && e.expense_date > to) return false;
      if (search) {
        const haystack = `${e.merchant ?? ""} ${e.description ?? ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, from, to, search]);

  const total = filtered.reduce((sum, e) => sum + e.amount, 0);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Expense deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} expense{filtered.length === 1 ? "" : "s"} · {formatCurrency(total, filtered[0]?.currency ?? "INR")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportExpensesToCsv(filtered)}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <ExpenseFormDialog categories={categories} defaultCurrency={defaultCurrency} onSaved={load} />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Merchant or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          {(search || categoryFilter !== ALL || from || to) && (
            <Button variant="ghost" onClick={() => { setSearch(""); setCategoryFilter(ALL); setFrom(""); setTo(""); }}>
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">No expenses match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Merchant / Notes</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">{e.expense_date}</TableCell>
                    <TableCell>
                      {e.category ? (
                        <Badge style={{ backgroundColor: e.category.color, color: "white", borderColor: "transparent" }}>
                          {e.category.icon} {e.category.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Uncategorized</Badge>
                      )}
                      {e.is_recurring && <Badge variant="secondary" className="ml-1">Recurring</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{e.merchant || "—"}</div>
                      {e.description && <div className="text-xs text-muted-foreground">{e.description}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.payment_method || "—"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.amount, e.currency)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <ExpenseFormDialog
                          categories={categories}
                          defaultCurrency={defaultCurrency}
                          expense={e}
                          onSaved={load}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
                              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(e.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
