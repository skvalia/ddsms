import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function WorkloadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [{ data: designers }, { data: artists }, { data: pendingDssr }, { data: pendingSketches }] = await Promise.all([
    supabase.from("designers").select("id, name").order("name"),
    supabase.from("sketch_artists").select("id, name").order("name"),
    supabase.from("dssr").select("id, dssr_number, design_number, status, designer_id, party:parties(name)")
      .not("designer_id", "is", null)
      .in("status", ["New", "CAD Development", "EMB Development", "Ready For Sampling"]),
    supabase.from("sketches").select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
      .not("sketch_artist_id", "is", null)
      .in("status", ["Draft", "In Progress"]),
  ]);

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Team Workload</h1>
        <p className="text-sm text-stone-500 mb-6">Pending work per person</p>

        {/* Designers */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Designers — {designers?.length ?? 0} people
        </h2>
        <div className="space-y-3 mb-8">
          {(designers ?? []).map((d: any) => {
            const work = (pendingDssr ?? []).filter((r: any) => r.designer_id === d.id);
            return (
              <div key={d.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{d.name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    work.length === 0 ? "bg-green-100 text-green-700" :
                    work.length <= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {work.length === 0 ? "Free" : `${work.length} pending`}
                  </span>
                </div>
                {work.length > 0 && (
                  <div className="space-y-1.5">
                    {work.map((r: any) => (
                      <Link key={r.id} href={`/dssr/${r.id}`}
                        className="flex items-center justify-between text-sm text-stone-600 hover:text-amber-700 bg-stone-50 rounded-lg px-3 py-1.5">
                        <span>{r.dssr_number}{r.design_number ? ` — ${r.design_number}` : ""}</span>
                        <span className="text-xs text-stone-400">{r.status}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {(!designers || designers.length === 0) && (
            <p className="text-sm text-stone-400">No designers added yet. <Link href="/settings/master-data" className="text-amber-700 font-medium">Add in Manage Data →</Link></p>
          )}
        </div>

        {/* Sketch Artists */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Sketch Artists — {artists?.length ?? 0} people
        </h2>
        <div className="space-y-3">
          {(artists ?? []).map((a: any) => {
            const work = (pendingSketches ?? []).filter((r: any) => r.sketch_artist_id === a.id);
            return (
              <div key={a.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{a.name}</p>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    work.length === 0 ? "bg-green-100 text-green-700" :
                    work.length <= 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                  }`}>
                    {work.length === 0 ? "Free" : `${work.length} pending`}
                  </span>
                </div>
                {work.length > 0 && (
                  <div className="space-y-1.5">
                    {work.map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between text-sm text-stone-600 bg-stone-50 rounded-lg px-3 py-1.5">
                        <span>{r.sketch_number}{r.inspiration?.concept_name ? ` — ${r.inspiration.concept_name}` : ""}</span>
                        <span className="text-xs text-stone-400">{r.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {(!artists || artists.length === 0) && (
            <p className="text-sm text-stone-400">No sketch artists added yet. <Link href="/settings/master-data" className="text-amber-700 font-medium">Add in Manage Data →</Link></p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
