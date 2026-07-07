"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function signInWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) console.error("Login failed:", error.message);
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sidebar p-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{ background: "radial-gradient(circle at 30% 20%, hsl(var(--sidebar-active) / 0.25), transparent 60%)" }}
      />
      <Card className="relative w-full max-w-sm border-sidebar-border bg-card/95 shadow-2xl">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-primary/40 text-primary">
            <span className="font-serif text-xl italic">L</span>
          </div>
          <CardTitle className="font-serif text-3xl italic">Ledger</CardTitle>
          <CardDescription>Sign in to track income, spending, budgets, and savings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await signInWithGoogle();
            }}
          >
            <svg viewBox="0 0 48 48" className="h-4 w-4">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.9 1.1 8 3l6-6C34.9 5.1 29.7 3 24 3 16.1 3 9.2 7.4 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 45c5.6 0 10.7-2.1 14.5-5.6l-6.7-5.5C29.7 35.7 27 36.8 24 36.8c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.1 40.5 15.9 45 24 45z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.7 5.5C41.6 35.7 45 30.4 45 24c0-1.2-.1-2.3-.4-3.5z" />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
