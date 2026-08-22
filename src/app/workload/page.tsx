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
    { data: pendingInsp },
    { data: pendingSsr },
  ] = await Promise.all([
    supabase.from("designers").select("id, name").order("name"),
    supabase.from("sketch_artists").select("id, name").order("name"),
    // DSSRs assigned to designers but not complete
    supabase.from("dssr")
      .select("id, dssr_number, design_number, status, machine_type, designer_id, party:parties(name)")
      .not("designer_id", "is", null)
      .not("status", "in", "("Approved","Archived")"),
    // Sketches assigned to artists but not complete
    supabase.from("sketches")
      .select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
      .not("sketch_artist_id", "is", null)
      .not("status", "in", "("Ready for DSSR","Completed")"),
    // Inspirations NOT assigned to any sketcher
    supabase.from("inspirations")
      .select("id, concept_name, season, assigned_sketcher_id, party:parties(name)")
      .is("assigned_sketcher_id", null)
      .order("created_at", { ascending: false })
      .limit(50),
    // SSRs not done - with machine type from SSR or DSSR
    supabase.from("ssr")
      .select("id, ssr_number, design_number, status, machine_type, machine_type_override, dssr:dssr(machine_type), party:parties(name)")
      .neq("status", "Done")
      .neq("status", "Completed")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  // Resolve machine type for each SSR: override > own > dssr
  const ssrWithMachine = (pendingSsr ?? []).map((s: any) => ({
    ...s,
    resolved_machine: s.machine_type_override || s.machine_type || s.dssr?.machine_type || null,
  }));

  // Group SSRs by machine type
  const ssrByMachine: Record<string, any[]> = {};
  ssrWithMachine.forEach((s: any) => {
    if (s.resolved_machine) {
      if (!ssrByMachine[s.resolved_machine]) ssrByMachine[s.resolved_machine] = [];
      ssrByMachine[s.resolved_machine].push(s);
    }
  });

  return (
    <AppShell userName={userName}>
      <WorkloadClient
        designers={(designers as any[]) ?? []}
        artists={(artists as any[]) ?? []}
        pendingDssr={(pendingDssr as any[]) ?? []}
        pendingSketches={(pendingSketches as any[]) ?? []}
        pendingInsp={(pendingInsp as any[]) ?? []}
        ssrByMachine={ssrByMachine}
      />
    </AppShell>
  );
}
