import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from Google via Supabase's OAuth flow and
// exchanges the auth code for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { user } = data.session;

      await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? (user.user_metadata?.name as string) ?? null,
        avatar_url: (user.user_metadata?.avatar_url as string) ?? null,
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
