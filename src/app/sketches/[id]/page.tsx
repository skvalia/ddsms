import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default async function SketchDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: sketch } = await supabase
    .from("sketches")
    .select("*, inspiration:inspirations(id, concept_name)")
    .eq("id", id)
    .maybeSingle();

  if (!sketch) return notFound();

  // Get DSSRs linked to this sketch
  const { data: dssrs } = await supabase
    .from("dssr")
    .select("*, party:parties(name)")
    .eq("sketch_id", id)
    .order("created_at", { ascending: false });

  const photoUrl = sketch.photo_path
    ? `${SUPABASE_URL}/storage/v1/object/public/sketch-files/${sketch.photo_path}`
    : null;

  return (
    <AppShell userName={userName}>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-stone-400 mb-5">
          <Link href="/inspirations" className="hover:text-stone-600">Inspirations</Link>
          {sketch.inspiration && (
            <>
              <span>→</span>
              <Link href={`/inspirations/${sketch.inspiration.id}`}
                className="hover:text-stone-600">{sketch.inspiration.concept_name}</Link>
            </>
          )}
          <span>→</span>
          <span className="text-stone-700 font-medium">{sketch.sketch_number}</span>
        </div>

        {/* Photo */}
        {photoUrl && (
          <div className="rounded-2xl overflow-hidden mb-5 border border-stone-200">
            <img src={photoUrl} alt={sketch.sketch_number}
              className="w-full object-cover max-h-80" />
          </div>
        )}

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {sketch.sketch_number || "Untitled Sketch"}
            </h1>
            <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
              sketch.status === "Ready for DSSR"
                ? "bg-green-100 text-green-700"
                : sketch.status === "Completed"
                ? "bg-blue-100 text-blue-700"
                : "bg-stone-100 text-stone-600"
            }`}>{sketch.status}</span>
          </div>
          {sketch.sketched_by && (
            <p className="text-sm text-stone-500 mt-1">✏️ Sketched by {sketch.sketched_by}</p>
          )}
          {sketch.description && (
            <p className="mt-3 text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">
              {sketch.description}
            </p>
          )}
          {sketch.notes && (
            <p className="mt-2 text-sm text-stone-500 italic px-1">{sketch.notes}</p>
          )}
        </div>

        {/* DSSR Section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
              Design Records / DSSR ({dssrs?.length ?? 0})
            </h2>
            <Link
              href={`/dssr/new?sketch=${id}${sketch.inspiration ? `&inspiration=${sketch.inspiration.id}` : ""}`}
              className="bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
              + Create DSSR
            </Link>
          </div>

          {dssrs && dssrs.length > 0 ? (
            <div className="space-y-2">
              {dssrs.map((d: any) => (
                <Link key={d.id} href={`/dssr/${d.id}`}
                  className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-semibold text-sm">{d.dssr_number}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {d.design_number && <span className="mr-2">{d.design_number}</span>}
                      {d.party?.name && <span>{d.party.name}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {d.status}
                    </span>
                    <span className="text-stone-400">→</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">
              <p className="text-sm text-stone-400 mb-1">No design record yet</p>
              <p className="text-xs text-stone-300 mb-3">
                Create a DSSR to assign a designer and track design development
              </p>
              <Link
                href={`/dssr/new?sketch=${id}${sketch.inspiration ? `&inspiration=${sketch.inspiration.id}` : ""}`}
                className="inline-block bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
                + Create DSSR from this sketch
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
