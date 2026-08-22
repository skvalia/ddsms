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
    { data: allDssr },
    { data: pendingSketches },
  ] = await Promise.all([
    supabase.from("designers").select("id, name").order("name"),
    supabase.from("sketch_artists").select("id, name").order("name"),
    // Get ALL active DSSRs with machine type and designer
    supabase.from("dssr")
      .select("id, dssr_number, design_number, status, machine_type, designer_id, party:parties(name)")
      .not("status", "eq", "Archived")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase.from("sketches")
      .select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
      .not("sketch_artist_id", "is", null)
      .in("status", ["Draft", "In Progress"]),
  ]);

  // Pending by designer (active DSSRs)
  const pendingDssr = (allDssr ?? []).filter((d: any) =>
    d.designer_id && ["New", "CAD Development", "EMB Development", "Ready For Sampling"].includes(d.status)
  );

  // Group ALL active DSSRs by machine type
  const dssrByMachine: Record<string, any[]> = {};
  (allDssr ?? []).forEach((d: any) => {
    if (d.machine_type) {
      if (!dssrByMachine[d.machine_type]) dssrByMachine[d.machine_type] = [];
      dssrByMachine[d.machine_type].push(d);
    }
  });

  return (
    <AppShell userName={userName}>
      <WorkloadClient
        designers={(designers as any[]) ?? []}
        artists={(artists as any[]) ?? []}
        pendingDssr={pendingDssr}
        pendingSketches={(pendingSketches as any[]) ?? []}
        dssrByMachine={dssrByMachine}
      />
    </AppShell>
  );
}
