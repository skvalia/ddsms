import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: dssrs } = await supabase
    .from("dssr")
    .select("*, party:parties(*), files:dssr_files(*)")
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data: ssrs } = await supabase
    .from("ssr")
    .select("*, party:parties(*), files:ssr_files(*)")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Design Library</h1>
        <p className="text-sm text-stone-500 mb-6">Visual grid of all designs and samples</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {(dssrs ?? []).map((d: any) => (
            <a key={d.id} href={`/dssr/${d.id}`}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-stone-100 flex items-center justify-center">
                <span className="text-3xl">🎨</span>
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{d.design_number || d.dssr_number}</p>
                <p className="text-xs text-stone-400 truncate">{d.party?.name || "No party"}</p>
              </div>
            </a>
          ))}
          {(ssrs ?? []).map((s: any) => (
            <a key={s.id} href={`/ssr/${s.id}`}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-stone-100 flex items-center justify-center">
                <span className="text-3xl">🧵</span>
              </div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{s.design_number || s.ssr_number}</p>
                <p className="text-xs text-stone-400 truncate">{s.party?.name || "No party"}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
