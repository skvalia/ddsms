import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { SsrDetailClient } from "@/components/SsrDetailClient";
import { notFound } from "next/navigation";

export default async function SsrDetailPage({
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

  const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const [
    { data: ssr },
    { data: files },
    { data: history },
    { data: comments },
    { data: linkedDssrs },
    { data: designTracking },
  ] = await Promise.all([
    supabase.from("ssr").select("*, party:parties(*), dssr:dssr(*, party:parties(*))").eq("id", id).maybeSingle(),
    supabase.from("ssr_files").select("*").eq("ssr_id", id).order("created_at", { ascending: false }),
    supabase.from("status_history").select("*").eq("ssr_id", id).order("changed_at", { ascending: false }),
    supabase.from("comments").select("*").eq("ssr_id", id).order("created_at", { ascending: false }),
    supabase.from("ssr_dssrs").select("*, dssr:dssr(*)").eq("ssr_id", id),
    supabase.from("ssr_design_tracking").select("*, dssr:dssr(dssr_number, design_number), sketch:sketches(sketch_number, photo_path)").eq("ssr_id", id),
  ]);

  if (!ssr) return notFound();

  // Collect all DSSR IDs linked to this SSR
  const dssrIds: string[] = [];
  // From junction table
  (linkedDssrs ?? []).forEach((ld: any) => { if (ld.dssr_id) dssrIds.push(ld.dssr_id); });
  // From direct SSR.dssr_id link (old method)
  if ((ssr as any).dssr_id && !dssrIds.includes((ssr as any).dssr_id)) {
    dssrIds.push((ssr as any).dssr_id);
  }

  // Build journey data from all linked DSSRs
  const journeyData: any[] = [];
  const seenInspirations = new Set<string>();
  const seenSketches = new Set<string>();

  if (dssrIds.length > 0) {
    // Get all sketches linked to these DSSRs (via dssr_id OR via dssr.sketch_id)
    const { data: sketchesByDssrId } = await supabase
      .from("sketches")
      .select("*, inspiration:inspirations(id, concept_name, photo_path)")
      .in("dssr_id", dssrIds);

    // Also get sketches linked via old dssr.sketch_id
    const { data: dssrRows } = await supabase
      .from("dssr")
      .select("sketch_id")
      .in("id", dssrIds)
      .not("sketch_id", "is", null);

    const oldSketchIds = (dssrRows ?? []).map((d: any) => d.sketch_id).filter(Boolean);
    let oldSketches: any[] = [];
    if (oldSketchIds.length > 0) {
      const { data: os } = await supabase
        .from("sketches")
        .select("*, inspiration:inspirations(id, concept_name, photo_path)")
        .in("id", oldSketchIds);
      oldSketches = os ?? [];
    }

    const allSketches = [...(sketchesByDssrId ?? []), ...oldSketches];

    for (const s of allSketches) {
      if (seenSketches.has(s.id)) continue;
      seenSketches.add(s.id);

      // Add inspiration photo (once per inspiration)
      if (s.inspiration?.photo_path && !seenInspirations.has(s.inspiration.id)) {
        seenInspirations.add(s.inspiration.id);
        journeyData.push({
          type: "inspiration",
          label: s.inspiration.concept_name,
          photoUrl: `${SURL}/storage/v1/object/public/inspiration-files/${s.inspiration.photo_path}`,
        });
      }

      // Add sketch photo
      if (s.photo_path) {
        journeyData.push({
          type: "sketch",
          label: s.sketch_number || "Sketch",
          designNumber: s.design_number,
          photoUrl: `${SURL}/storage/v1/object/public/sketch-files/${s.photo_path}`,
        });
      }
    }
  }

  // Add final sample photos from SSR files
  const samplePhotos = (files ?? []).filter((f: any) =>
    ["jpg","jpeg","png","webp"].includes(f.file_type?.toLowerCase() || "")
  );
  samplePhotos.forEach((f: any) => {
    journeyData.push({
      type: "sample",
      label: "Sample Photo",
      photoUrl: `${SURL}/storage/v1/object/public/ssr-files/${f.file_path}`,
    });
  });

  return (
    <AppShell userName={userName}>
      <SsrDetailClient
        ssr={ssr as any}
        files={(files as any[]) ?? []}
        history={(history as any[]) ?? []}
        comments={(comments as any[]) ?? []}
        userId={user?.id ?? ""}
        linkedDssrs={(linkedDssrs as any[]) ?? []}
        designTracking={(designTracking as any[]) ?? []}
        journeyData={journeyData}
        supabaseUrl={SURL}
      />
    </AppShell>
  );
}
