import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default async function InspirationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: insp } = await supabase.from("inspirations").select("*, party:parties(name)").eq("id", id).maybeSingle();
  if (!insp) return notFound();

  const { data: sketches } = await supabase.from("sketches").select("*").eq("inspiration_id", id).order("created_at", { ascending: false });

  const photoUrl = insp.photo_path ? `${SUPABASE_URL}/storage/v1/object/public/inspiration-files/${insp.photo_path}` : null;

  return (
    <AppShell userName={userName}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <Link href="/inspirations" className="text-sm text-stone-500">← Inspirations</Link>
          <Link href={`/inspirations/${id}/edit`} className="text-sm font-semibold text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
            ✏️ Edit
          </Link>
        </div>

        {photoUrl && (
          <div className="rounded-2xl overflow-hidden mb-5 border border-stone-200">
            <img src={photoUrl} alt={insp.concept_name} className="w-full object-cover max-h-72" />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{insp.concept_name}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-stone-500">
            {insp.party?.name && <span>👥 {insp.party.name}</span>}
            {insp.season && <span>📅 {insp.season}</span>}
            {insp.design_count && <span>🎨 {insp.design_count} designs planned</span>}
          </div>
          {insp.notes && <p className="mt-3 text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">{insp.notes}</p>}
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">Sketches ({sketches?.length ?? 0})</h2>
            <Link href={`/sketches/new?inspiration=${id}`} className="text-sm font-semibold text-amber-700">+ Add Sketch</Link>
          </div>

          {sketches && sketches.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {sketches.map((s: any) => {
                const sketchPhoto = s.photo_path ? `${SUPABASE_URL}/storage/v1/object/public/sketch-files/${s.photo_path}` : null;
                return (
                  <Link key={s.id} href={`/sketches/${s.id}`}
                    className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                      {sketchPhoto ? <img src={sketchPhoto} alt={s.sketch_number} className="w-full h-full object-cover" /> : <span className="text-3xl">✏️</span>}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold">{s.sketch_number || "Untitled"}</p>
                      {s.design_number && <p className="text-xs text-amber-700 font-medium mt-0.5">Design: {s.design_number}</p>}
                      <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        s.status === "Ready for DSSR" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"
                      }`}>{s.status}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">
              <p className="text-sm text-stone-400 mb-2">No sketches yet</p>
              <Link href={`/sketches/new?inspiration=${id}`} className="text-sm font-semibold text-amber-700">Add first sketch →</Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
