import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";

export default async function InspirationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const { data: inspirations } = await supabase
    .from("inspirations")
    .select("*, party:parties(name)")
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={userName}>
      <div className="px-4 md:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inspirations</h1>
            <p className="text-sm text-stone-500 mt-0.5">{inspirations?.length ?? 0} concepts</p>
          </div>
          <Link href="/inspirations/new"
            className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
            + New Inspiration
          </Link>
        </div>

        {(!inspirations || inspirations.length === 0) ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-5xl mb-4">💡</p>
            <p className="text-sm font-medium">No inspirations yet</p>
            <Link href="/inspirations/new"
              className="inline-block mt-3 bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              Add first inspiration
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {inspirations.map((insp: any) => {
              const photoUrl = insp.photo_path
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/inspiration-files/${insp.photo_path}`
                : null;
              return (
                <Link key={insp.id} href={`/inspirations/${insp.id}`}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-video bg-stone-100 flex items-center justify-center overflow-hidden">
                    {photoUrl
                      ? <img src={photoUrl} alt={insp.concept_name} className="w-full h-full object-cover" />
                      : <span className="text-4xl">💡</span>}
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-semibold truncate">{insp.concept_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      {insp.party?.name && <span>{insp.party.name}</span>}
                      {insp.season && <span>{insp.season}</span>}
                      {insp.design_count && <span>{insp.design_count} designs</span>}
                    </div>
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
