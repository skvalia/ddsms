import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import InspirationDetailClient from "@/components/InspirationDetailClient";
import { notFound } from "next/navigation";

export default async function InspirationDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: ins } = await supabase
    .from("inspirations")
    .select("*, party:parties(name)")
    .eq("id", params.id)
    .maybeSingle();

  if (!ins) notFound();

  const { data: sketches } = await supabase
    .from("sketches")
    .select("*")
    .eq("inspiration_id", params.id)
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={userName}>
      <InspirationDetailClient
        inspiration={ins as any}
        sketches={(sketches as any[]) ?? []}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
