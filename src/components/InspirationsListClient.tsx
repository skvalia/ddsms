"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

export function InspirationsListClient({ inspirations, supabaseUrl }: { inspirations: any[]; supabaseUrl: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return inspirations;
    const q = search.toLowerCase();
    return inspirations.filter(i =>
      i.concept_name?.toLowerCase().includes(q) ||
      i.party?.name?.toLowerCase().includes(q) ||
      i.season?.toLowerCase().includes(q)
    );
  }, [search, inspirations]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspirations</h1>
          <p className="text-sm text-stone-500 mt-0.5">{filtered.length} of {inspirations.length} concepts</p>
        </div>
        <Link href="/inspirations/new"
          className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + New
        </Link>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search concept name, party, season..."
          className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-4 h-4" /></button>}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-sm">No inspirations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((insp: any) => {
            const photoUrl = insp.photo_path
              ? `${supabaseUrl}/storage/v1/object/public/inspiration-files/${insp.photo_path}`
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
                  <div className="flex items-center gap-3 mt-1 text-xs text-stone-400 flex-wrap">
                    {insp.party?.name && <span>{insp.party.name}</span>}
                    {insp.season && <span>{insp.season}</span>}
                    {insp.design_count && <span>{insp.design_count} designs</span>}
                  </div>
                  {insp.assigned_sketcher
                    ? <p className="text-xs text-green-600 mt-1">✓ {insp.assigned_sketcher.name}</p>
                    : <p className="text-xs text-amber-600 mt-1">⚠ Not assigned</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
