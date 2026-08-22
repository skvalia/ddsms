import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DssrListClient } from "@/components/DssrListClient";
import type { Dssr } from "@/types/database";

export default async function DssrPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data } = await supabase
    .from("dssr")
    .select("*, party:parties(*)")
    .order("updated_at", { ascending: false })
    .limit(300);

  return (
    <AppShell userName={userName}>
      <DssrListClient initialData={(data as Dssr[]) ?? []} initialStatus={status} />
    </AppShell>
  );
}
