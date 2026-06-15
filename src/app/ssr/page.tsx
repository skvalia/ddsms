import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { SsrListClient } from "@/components/SsrListClient";
import type { Ssr } from "@/types/database";

export default async function SsrPage({
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
    .from("ssr")
    .select("*, party:parties(*)")
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  return (
    <AppShell userName={userName}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="mb-1">
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
            Sampling Status Register
          </h1>
          <p className="text-sm text-(--color-ink-soft) mt-1 mb-4">
            Track every sample from YTR to dispatch
          </p>
        </div>
        <SsrListClient initialData={(data as Ssr[]) ?? []} initialStatus={status} />
      </div>
    </AppShell>
  );
}
