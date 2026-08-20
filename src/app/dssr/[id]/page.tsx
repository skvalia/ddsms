import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DssrDetailClient } from "@/components/DssrDetailClient";
import { notFound } from "next/navigation";

export default async function DssrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [
    { data: dssr },
    { data: files },
    { data: ssrs },
    { data: comments },
    { data: activity },
    { data: versions },
    { data: sketches },
  ] = await Promise.all([
    supabase.from("dssr").select("*, party:parties(*)").eq("id", id).maybeSingle(),
    supabase.from("dssr_files").select("*").eq("dssr_id", id).order("created_at", { ascending: false }),
    supabase.from("ssr").select("*, party:parties(*)").eq("dssr_id", id).order("entry_date", { ascending: false }),
    supabase.from("comments").select("*").eq("dssr_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_logs").select("*").eq("entity_id", id).order("created_at", { ascending: false }).limit(20),
    supabase.from("dssr_versions").select("*").eq("dssr_id", id).order("version_number", { ascending: false }),
    supabase.from("sketches").select("*").eq("dssr_id", id).order("created_at", { ascending: true }),
  ]);

  if (!dssr) return notFound();

  return (
    <AppShell userName={userName}>
      <DssrDetailClient
        dssr={dssr as any}
        files={(files as any[]) ?? []}
        ssrs={(ssrs as any[]) ?? []}
        comments={(comments as any[]) ?? []}
        activity={(activity as any[]) ?? []}
        versions={(versions as any[]) ?? []}
        sketches={(sketches as any[]) ?? []}
        userId={user?.id ?? ""}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
