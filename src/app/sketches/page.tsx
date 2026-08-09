import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default async function SketchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: sketches } = await supabase
    .from("sketches")
    .select("*, inspiration:inspirations(concept_name)")
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

        {(!sketches || sketches.length === 0) ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-5xl mb-4">✏️</p>
            <p className="text-sm font-medium">No sketches yet</p>
            <Link href="/sketches/new"
              className="inline-block mt-3 bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              Add first sketch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sketches.map((s: any) => {
              const photoUrl = s.photo_path
                ? `${SUPABASE_URL}/storage/v1/object/public/sketch-files/${s.photo_path}`
                : null;
              return (
                <Link key={s.id} href={`/sketches/${s.id}`}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                    {photoUrl
                      ? <img src={photoUrl} alt={s.sketch_number} className="w-full h-full object-cover" />
                      : <span className="text-3xl">✏️</span>}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold truncate">{s.sketch_number || "Untitled"}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {s.inspiration?.concept_name || "No inspiration linked"}
                    </p>
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.status === "Ready for DSSR" ? "bg-green-100 text-green-700" :
                      s.status === "Completed" ? "bg-blue-100 text-blue-700" :
                      "bg-stone-100 text-stone-600"
                    }`}>{s.status}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
