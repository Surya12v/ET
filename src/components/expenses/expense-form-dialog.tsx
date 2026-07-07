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
import { ReceiptUploader } from "@/components/expenses/receipt-uploader";
import { CURRENCIES, PAYMENT_METHODS, RECURRENCE_INTERVALS } from "@/lib/constants";
import type { Category, Expense } from "@/lib/types";
import { toast } from "sonner";

const UNCATEGORIZED = "uncategorized";

export function ExpenseFormDialog({
  categories,
  expense,
  defaultCurrency = "INR",
  onSaved,
  trigger,
}: {
  categories: Category[];
  expense?: Expense | null;
  defaultCurrency?: string;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [categoryId, setCategoryId] = useState<string>(UNCATEGORIZED);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<string>("monthly");

  useEffect(() => {
    if (!open) return;
    if (expense) {
      setAmount(String(expense.amount));
      setCurrency(expense.currency);
      setCategoryId(expense.category_id ?? UNCATEGORIZED);
      setDate(expense.expense_date);
      setMerchant(expense.merchant ?? "");
      setDescription(expense.description ?? "");
      setPaymentMethod(expense.payment_method ?? PAYMENT_METHODS[0]);
      setReceiptUrl(expense.receipt_url);
      setIsRecurring(expense.is_recurring);
      setRecurrenceInterval(expense.recurrence_interval ?? "monthly");
    } else {
      setAmount("");
      setCurrency(defaultCurrency);
      setCategoryId(UNCATEGORIZED);
      setDate(new Date().toISOString().slice(0, 10));
      setMerchant("");
      setDescription("");
      setPaymentMethod(PAYMENT_METHODS[0]);
      setReceiptUrl(null);
      setIsRecurring(false);
      setRecurrenceInterval("monthly");
    }
  }, [open, expense, defaultCurrency]);

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
        category_id: categoryId === UNCATEGORIZED ? null : categoryId,
        expense_date: date,
        merchant: merchant || null,
        description: description || null,
        payment_method: paymentMethod || null,
        receipt_url: receiptUrl,
        is_recurring: isRecurring,
        recurrence_interval: isRecurring ? recurrenceInterval : null,
      };

      if (expense) {
        const { error } = await supabase.from("expenses").update(payload).eq("id", expense.id);
        if (error) throw error;
        toast.success("Expense updated");
      } else {
        const { error } = await supabase.from("expenses").insert(payload);
        if (error) throw error;
        toast.success("Expense added");
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
            <Plus className="mr-2 h-4 w-4" /> Add expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Add expense"}</DialogTitle>
          <DialogDescription>Fill in the details below.</DialogDescription>
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
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNCATEGORIZED}>Uncategorized</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" placeholder="e.g. Uber, Trader Joe's" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Notes</Label>
            <Textarea id="description" placeholder="Optional details" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label htmlFor="recurring">Recurring expense</Label>
              <p className="text-xs text-muted-foreground">Auto-generate this expense on a schedule.</p>
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

          <div className="space-y-1.5">
            <Label>Receipt</Label>
            <div className="flex flex-wrap items-center gap-2">
              <ReceiptUploader value={receiptUrl} onChange={setReceiptUrl} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {expense ? "Save changes" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
