"use client";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Budget, Category } from "@/lib/types";
import { toast } from "sonner";

const OVERALL = "overall";

export function BudgetFormDialog({
  categories,
  existingCategoryIds,
  budget,
  onSaved,
  trigger,
}: {
  categories: Category[];
  existingCategoryIds: string[];
  budget?: Budget | null;
  onSaved: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(OVERALL);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategoryId(budget?.category_id ?? OVERALL);
    setAmount(budget ? String(budget.amount) : "");
  }, [open, budget]);

  const availableCategories = budget
    ? categories
    : categories.filter((c) => !existingCategoryIds.includes(c.id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed < 0) {
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
        category_id: categoryId === OVERALL ? null : categoryId,
        amount: parsed,
      };

      if (budget) {
        const { error } = await supabase.from("budgets").update(payload).eq("id", budget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").upsert(payload, { onConflict: "user_id,category_id" });
        if (error) throw error;
      }
      toast.success("Budget saved");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button><Plus className="mr-2 h-4 w-4" /> Add budget</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl italic">{budget ? "Edit budget" : "New monthly budget"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={!!budget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={OVERALL}>Overall (all spending)</SelectItem>
                {availableCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monthly limit</Label>
            <Input id="amount" type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
