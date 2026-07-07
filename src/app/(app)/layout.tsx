import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/nav/sidebar";
import { Topbar } from "@/components/nav/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url, default_currency")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-64">
        <Topbar
          name={profile?.full_name ?? user.email ?? "Account"}
          email={profile?.email ?? user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? undefined}
        />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
