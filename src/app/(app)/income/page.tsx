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
import { IncomeFormDialog } from "@/components/income/income-form-dialog";
import { formatCurrency } from "@/lib/currency";
import { exportIncomeToCsv } from "@/lib/csv";
import { INCOME_SOURCES } from "@/lib/constants";
import type { Income } from "@/lib/types";
import { toast } from "sonner";

const ALL = "all";

export default function IncomePage() {
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState<Income[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [{ data: inc }, { data: profile }] = await Promise.all([
      supabase.from("income").select("*").order("income_date", { ascending: false }),
      supabase.from("profiles").select("default_currency").maybeSingle(),
    ]);
    setIncome(inc ?? []);
    setDefaultCurrency(profile?.default_currency ?? "INR");
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return income.filter((i) => {
      if (sourceFilter !== ALL && i.source !== sourceFilter) return false;
      if (from && i.income_date < from) return false;
      if (to && i.income_date > to) return false;
      if (search) {
        const haystack = `${i.source} ${i.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [income, sourceFilter, from, to, search]);

  const total = filtered.reduce((sum, i) => sum + i.amount, 0);

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("income").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Income deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} entr{filtered.length === 1 ? "y" : "ies"} ·{" "}
            <span className="tabular font-serif italic text-positive">
              {formatCurrency(total, filtered[0]?.currency ?? defaultCurrency)}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportIncomeToCsv(filtered)}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <IncomeFormDialog defaultCurrency={defaultCurrency} onSaved={load} />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 pt-6">
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Source or note..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Source</label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All sources</SelectItem>
                {INCOME_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
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
          {(search || sourceFilter !== ALL || from || to) && (
            <Button variant="ghost" onClick={() => { setSearch(""); setSourceFilter(ALL); setFrom(""); setTo(""); }}>
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
            <p className="p-10 text-center text-sm text-muted-foreground">No income entries match these filters.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="whitespace-nowrap">{i.income_date}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{i.source}</Badge>
                      {i.is_recurring && <Badge variant="outline" className="ml-1">Recurring</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.notes || "—"}</TableCell>
                    <TableCell className="text-right tabular font-medium text-positive">{formatCurrency(i.amount, i.currency)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <IncomeFormDialog
                          income={i}
                          defaultCurrency={defaultCurrency}
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
                              <AlertDialogTitle>Delete this income entry?</AlertDialogTitle>
                              <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(i.id)}>Delete</AlertDialogAction>
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
