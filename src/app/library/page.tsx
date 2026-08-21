import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function photoUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [{ data: inspirations }, { data: sketches }, { data: dssrs }] = await Promise.all([
    supabase.from("inspirations").select("id, concept_name, photo_path, party:parties(name)").order("created_at", { ascending: false }).limit(100),
    supabase.from("sketches").select("id, sketch_number, design_number, photo_path, status").order("created_at", { ascending: false }).limit(100),
    supabase.from("dssr").select("id, dssr_number, design_number, status, party:parties(name), files:dssr_files(file_path, file_type)").order("updated_at", { ascending: false }).limit(100),
  ]);

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Design Library</h1>
        <p className="text-sm text-stone-500 mb-6">Visual overview of all designs across the pipeline</p>

        {/* ── Inspirations ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
              💡 Inspirations ({inspirations?.length ?? 0})
            </h2>
            <Link href="/inspirations" className="text-xs text-amber-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(inspirations ?? []).map((insp: any) => (
              <Link key={insp.id} href={`/inspirations/${insp.id}`}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                  {insp.photo_path
                    ? <img src={photoUrl("inspiration-files", insp.photo_path)} alt={insp.concept_name} className="w-full h-full object-cover" />
                    : <span className="text-3xl">💡</span>}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold truncate">{insp.concept_name}</p>
                  {insp.party?.name && <p className="text-[10px] text-stone-400 truncate">{insp.party.name}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Sketches ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
              ✏️ Sketches ({sketches?.length ?? 0})
            </h2>
            <Link href="/sketches" className="text-xs text-amber-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(sketches ?? []).map((s: any) => (
              <Link key={s.id} href={`/sketches/${s.id}`}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                  {s.photo_path
                    ? <img src={photoUrl("sketch-files", s.photo_path)} alt={s.sketch_number || ""} className="w-full h-full object-cover" />
                    : <span className="text-3xl">✏️</span>}
                </div>
                <div className="px-2.5 py-2">
                  <p className="text-xs font-semibold truncate">{s.sketch_number || "Untitled"}</p>
                  {s.design_number && <p className="text-[10px] text-amber-700 font-medium truncate">{s.design_number}</p>}
                  <p className="text-[10px] text-stone-400">{s.status}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Final Designs (DSSR) ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
              🎨 Final Designs / DSSR ({dssrs?.length ?? 0})
            </h2>
            <Link href="/dssr" className="text-xs text-amber-700 font-medium">View all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {(dssrs ?? []).map((d: any) => {
              const imgFile = (d.files ?? []).find((f: any) =>
                ["jpg","jpeg","png","webp"].includes(f.file_type?.toLowerCase() || "")
              );
              return (
                <Link key={d.id} href={`/dssr/${d.id}`}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                    {imgFile
                      ? <img src={photoUrl("dssr-files", imgFile.file_path)} alt={d.design_number || d.dssr_number} className="w-full h-full object-cover" />
                      : <span className="text-3xl">🎨</span>}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="text-xs font-semibold truncate">{d.design_number || d.dssr_number}</p>
                    {d.party?.name && <p className="text-[10px] text-stone-400 truncate">{d.party.name}</p>}
                    <p className="text-[10px] text-stone-400">{d.status}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
