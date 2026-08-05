import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import InspirationClient from "@/components/InspirationClient";

export default async function InspirationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: inspirations } = await supabase
    .from("inspirations")
    .select("*, party:parties(name), sketches(id)")
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={userName}>
      <InspirationClient
        inspirations={(inspirations as any[]) ?? []}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
