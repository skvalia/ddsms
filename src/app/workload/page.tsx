import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { WorkloadClient } from "@/components/WorkloadClient";

export default async function WorkloadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [
    { data: designers },
    { data: artists },
    { data: pendingDssr },
    { data: pendingSketches },
    { data: pendingSsr },
  ] = await Promise.all([
    supabase.from("designers").select("id, name").order("name"),
    supabase.from("sketch_artists").select("id, name").order("name"),
    supabase.from("dssr")
      .select("id, dssr_number, design_number, status, machine_type, designer_id, party:parties(name)")
      .not("designer_id", "is", null)
      .in("status", ["New", "CAD Development", "EMB Development", "Ready For Sampling"]),
    supabase.from("sketches")
      .select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
      .not("sketch_artist_id", "is", null)
      .in("status", ["Draft", "In Progress"]),
    // Get SSRs with machine_type — join via dssr to get machine type even if not set on SSR directly
    supabase.from("ssr")
      .select("id, ssr_number, design_number, status, machine_type, dssr:dssr(machine_type), party:parties(name)")
      .not("status", "in", '("Done","Completed","Archived")')
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // Resolve machine type: SSR own machine_type OR from linked DSSR
  const ssrWithMachine = (pendingSsr ?? []).map((s: any) => ({
    ...s,
    resolved_machine_type: s.machine_type || s.dssr?.machine_type || null,
  })).filter((s: any) => s.resolved_machine_type);

  return (
    <AppShell userName={userName}>
      <WorkloadClient
        designers={(designers as any[]) ?? []}
        artists={(artists as any[]) ?? []}
        pendingDssr={(pendingDssr as any[]) ?? []}
        pendingSketches={(pendingSketches as any[]) ?? []}
        ssrWithMachine={ssrWithMachine}
      />
    </AppShell>
  );
}
