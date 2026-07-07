"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES, INCOME_SOURCES, RECURRENCE_INTERVALS } from "@/lib/constants";
import type { Income } from "@/lib/types";
import { toast } from "sonner";

export function IncomeFormDialog({
  income,
  defaultCurrency = "INR",
  onSaved,
  trigger,
}: {
  income?: Income | null;
  defaultCurrency?: string;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [source, setSource] = useState<string>(INCOME_SOURCES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("monthly");

  useEffect(() => {
    if (!open) return;
    if (income) {
      setAmount(String(income.amount));
      setCurrency(income.currency);
      setSource(income.source);
      setDate(income.income_date);
      setNotes(income.notes ?? "");
      setIsRecurring(income.is_recurring);
      setRecurrenceInterval(income.recurrence_interval ?? "monthly");
    } else {
      setAmount("");
      setCurrency(defaultCurrency);
      setSource(INCOME_SOURCES[0]);
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setIsRecurring(false);
      setRecurrenceInterval("monthly");
    }
  }, [open, income, defaultCurrency]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const payload = {
        user_id: user.id,
        amount: parsedAmount,
        currency,
        source,
        income_date: date,
        notes: notes || null,
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
      };

      if (income) {
        const { error } = await supabase.from("income").update(payload).eq("id", income.id);
        if (error) throw error;
        toast.success("Income updated");
      } else {
        const { error } = await supabase.from("income").insert(payload);
        if (error) throw error;
        toast.success("Income added");
      }

      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error((err as Error).message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add income
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl italic">{income ? "Edit income" : "Add income"}</DialogTitle>
          <DialogDescription>Salary, freelance work, or any other money coming in.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INCOME_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Optional details" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="recurring">Recurring income</Label>
              <p className="text-xs text-muted-foreground">e.g. a monthly salary — auto-generate on a schedule.</p>
            </div>
            <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
          </div>
          {isRecurring && (
            <div className="space-y-1.5">
              <Label>Repeats</Label>
              <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE_INTERVALS.map((r) => (
                    <SelectItem key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {income ? "Save changes" : "Add income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
