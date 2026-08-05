import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function SketchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: sketches } = await supabase
    .from("sketches")
    .select("*, inspiration:inspirations(concept_name), party:parties(name)")
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sketches</h1>
            <p className="text-sm text-stone-500 mt-0.5">{sketches?.length ?? 0} sketches</p>
          </div>
          <Link href="/sketches/new"
            className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            + New Sketch
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {(sketches ?? []).map((s: any) => (
            <div key={s.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <div className="aspect-square bg-stone-100 flex items-center justify-center">
                {s.sketch_url
                  ? <img src={s.sketch_url} alt={s.sketch_number} className="w-full h-full object-cover" />
                  : <span className="text-3xl">✏️</span>}
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{s.sketch_number}</p>
                <p className="text-xs text-stone-400 truncate">{s.inspiration?.concept_name || "No inspiration linked"}</p>
                <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  s.status === "Ready for DSSR" ? "bg-green-100 text-green-700" :
                  s.status === "Draft" ? "bg-stone-100 text-stone-600" : "bg-amber-100 text-amber-700"
                }`}>{s.status}</span>
              </div>
            </div>
          ))}
          {(!sketches || sketches.length === 0) && (
            <div className="col-span-full text-center py-16 text-stone-400">
              <p className="text-4xl mb-3">✏️</p>
              <p className="text-sm">No sketches yet</p>
              <Link href="/sketches/new" className="text-amber-700 text-sm font-medium mt-2 inline-block">
                Add first sketch →
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
