import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: dssrs } = await supabase
    .from("dssr")
    .select("id, design_number, dssr_number, status, party:parties(name)")
    .order("updated_at", { ascending: false })
    .limit(200);

  const { data: ssrs } = await supabase
    .from("ssr")
    .select("id, design_number, ssr_number, status, party:parties(name)")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Design Library</h1>
            <p className="text-sm text-stone-500 mt-0.5">All designs and samples</p>
          </div>
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Designs (DSSR) — {dssrs?.length ?? 0}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {(dssrs ?? []).map((d: any) => (
            <Link key={d.id} href={`/dssr/${d.id}`}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-stone-100 flex items-center justify-center text-4xl">🎨</div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{d.design_number || d.dssr_number}</p>
                <p className="text-xs text-stone-400 truncate">{(d.party as any)?.name || "—"}</p>
                <p className="text-xs text-stone-400 mt-0.5">{d.status}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Samples (SSR) — {ssrs?.length ?? 0}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(ssrs ?? []).map((s: any) => (
            <Link key={s.id} href={`/ssr/${s.id}`}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-amber-50 flex items-center justify-center text-4xl">🧵</div>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold truncate">{s.design_number || s.ssr_number}</p>
                <p className="text-xs text-stone-400 truncate">{(s.party as any)?.name || "—"}</p>
                <p className="text-xs text-stone-400 mt-0.5">{s.status}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
