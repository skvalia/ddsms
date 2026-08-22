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
    supabase.from("ssr_dssrs").select("*, dssr:dssr(*, party:parties(*), sketches:sketches(*))").eq("ssr_id", id),
    supabase.from("ssr_design_tracking").select("*, dssr:dssr(dssr_number, design_number), sketch:sketches(sketch_number, photo_path)").eq("ssr_id", id),
  ]);

  if (!ssr) return notFound();

  // Build journey data: inspiration → sketch → sample
  const journeyData = await buildJourney(supabase, ssr as any, linkedDssrs as any[]);

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
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}

async function buildJourney(supabase: any, ssr: any, linkedDssrs: any[]) {
  const journey: any[] = [];
  const SURL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  // Get all DSSRs linked to this SSR
  const dssrIds = (linkedDssrs ?? []).map((ld: any) => ld.dssr_id).filter(Boolean);
  if (ssr?.dssr_id && !dssrIds.includes(ssr.dssr_id)) dssrIds.push(ssr.dssr_id);

  if (dssrIds.length === 0) return journey;

  // Get sketches linked to those DSSRs
  const { data: sketches } = await supabase
    .from("sketches")
    .select("*, inspiration:inspirations(id, concept_name, photo_path)")
    .in("dssr_id", dssrIds);

  // Build journey items
  const seen = new Set();
  for (const s of (sketches ?? [])) {
    // Inspiration photo
    if (s.inspiration?.photo_path && !seen.has(s.inspiration.id)) {
      seen.add(s.inspiration.id);
      journey.push({
        type: "inspiration",
        label: s.inspiration.concept_name,
        photoUrl: `${SURL}/storage/v1/object/public/inspiration-files/${s.inspiration.photo_path}`,
      });
    }
    // Sketch photo
    if (s.photo_path) {
      journey.push({
        type: "sketch",
        label: s.sketch_number || "Sketch",
        designNumber: s.design_number,
        photoUrl: `${SURL}/storage/v1/object/public/sketch-files/${s.photo_path}`,
      });
    }
  }

  return journey;
}
