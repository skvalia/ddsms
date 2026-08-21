import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function WorkloadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [
    { data: designers },
    { data: artists },
    { data: pendingDssr },
    { data: pendingSketches },
    { data: pendingSsr },
  ] = await Promise.all([
    supabase.from("designers").select("id, name").order("name"),
    supabase.from("sketch_artists").select("id, name").order("name"),
    supabase.from("dssr").select("id, dssr_number, design_number, status, designer_id, party:parties(name)")
      .not("designer_id", "is", null)
      .in("status", ["New", "CAD Development", "EMB Development", "Ready For Sampling"]),
    supabase.from("sketches").select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
      .not("sketch_artist_id", "is", null)
      .in("status", ["Draft", "In Progress"]),
    supabase.from("ssr").select("id, ssr_number, design_number, status, machine_type, party:parties(name)")
      .not("machine_type", "is", null)
      .not("status", "in", '("Done","Completed")')
      .order("machine_type"),
  ]);

  // Group SSRs by machine type
  const ssrByMachine: Record<string, any[]> = {};
  (pendingSsr ?? []).forEach((s: any) => {
    const mt = s.machine_type || "Unassigned";
    if (!ssrByMachine[mt]) ssrByMachine[mt] = [];
    ssrByMachine[mt].push(s);
  });

  const machineColors: Record<string, string> = {
    "Schiffli": "bg-blue-100 text-blue-700",
    "Multi": "bg-purple-100 text-purple-700",
    "Aari": "bg-green-100 text-green-700",
    "Cording": "bg-amber-100 text-amber-700",
    "Pentacut": "bg-pink-100 text-pink-700",
    "Schiffli-Cording": "bg-indigo-100 text-indigo-700",
  };

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Team Workload</h1>
        <p className="text-sm text-stone-500 mb-6">Pending work per person and per machine</p>

        {/* ── SSR by Machine Type ── */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          🔧 Pending Samples by Machine Type
        </h2>
        {Object.keys(ssrByMachine).length === 0 ? (
          <p className="text-sm text-stone-400 mb-8">No pending samples with machine type assigned.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {Object.entries(ssrByMachine).map(([machine, ssrs]) => (
              <div key={machine} className="bg-white border border-stone-200 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${machineColors[machine] || "bg-stone-100 text-stone-600"}`}>
                    {machine}
                  </span>
                  <span className="text-xs text-stone-500">{ssrs.length} pending</span>
                </div>
                <div className="space-y-1.5">
                  {ssrs.map((s: any) => (
                    <Link key={s.id} href={`/ssr/${s.id}`}
                      className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-1.5 hover:bg-stone-100">
                      <span className="font-medium">
                        {s.ssr_number}
                        {s.design_number && <span className="text-stone-400 ml-2 font-normal">{s.design_number}</span>}
                      </span>
                      <span className="text-xs text-stone-400">{s.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Designers ── */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          🎨 Designers — DSSR Workload
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

        {/* ── Sketch Artists ── */}
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          ✏️ Sketch Artists — Workload
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
