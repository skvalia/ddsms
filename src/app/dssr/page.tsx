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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data } = await supabase
    .from("dssr")
    .select("*, party:parties(*)")
    .order("updated_at", { ascending: false })
    .limit(300);

  return (
    <AppShell userName={userName}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="mb-1">
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
            Design Development Request Register
          </h1>
          <p className="text-sm text-(--color-ink-soft) mt-1 mb-4">
            Master design records with version history
          </p>
        </div>
        <DssrListClient initialData={(data as Dssr[]) ?? []} initialStatus={status} />
      </div>
    </AppShell>
  );
}
