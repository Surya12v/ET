"use client";
import { useEffect, useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURRENCIES } from "@/lib/constants";
import { toast } from "sonner";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [savingCurrency, setSavingCurrency] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      setEmail(profile?.email ?? user.email ?? "");
      setFullName(profile?.full_name ?? "");
      setCurrency(profile?.default_currency ?? "INR");
      setLoading(false);
    })();
  }, []);

  async function updateCurrency(value: string) {
    setCurrency(value);
    setSavingCurrency(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ default_currency: value }).eq("id", user.id);
    }
    setSavingCurrency(false);
    toast.success("Default currency updated");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-10 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading...
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Name</Label>
            <p className="text-sm">{fullName || "—"}</p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm">{email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5">
          <Label>Default currency</Label>
          <Select value={currency} onValueChange={updateCurrency} disabled={savingCurrency}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
