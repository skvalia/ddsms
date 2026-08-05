"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, ImageOff, Layers } from "lucide-react";
import { format } from "date-fns";

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

function getThumb(supabaseUrl: string, filePath: string | null) {
  if (!filePath) return null;
  const ext = filePath.split(".").pop()?.toLowerCase();
  if (!IMAGE_EXT.includes(ext || "")) return null;
  return `${supabaseUrl}/storage/v1/object/public/inspiration-files/${filePath}`;
}

export default function InspirationClient({
  inspirations, supabaseUrl,
}: { inspirations: any[]; supabaseUrl: string }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    inspirations.filter((r) =>
      !search || [r.concept_name, r.party?.name, r.season].some(
        (v) => v?.toLowerCase().includes(search.toLowerCase())
      )
    ), [search, inspirations]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspiration</h1>
          <p className="text-sm text-stone-500 mt-0.5">{inspirations.length} concepts</p>
        </div>
        <Link href="/inspirations/new"
          className="flex items-center gap-1.5 bg-amber-700 text-white rounded-xl px-4 py-2 text-sm font-semibold">
          <Plus className="w-4 h-4" /> New Inspiration
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search concept name, party, season..."
          className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <ImageOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No inspirations yet — add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((ins) => {
            const thumb = getThumb(supabaseUrl, ins.photo_path);
            return (
              <Link key={ins.id} href={`/inspirations/${ins.id}`}
                className="group bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                {/* Photo */}
                <div className="aspect-square bg-stone-50 relative overflow-hidden">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={ins.concept_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff className="w-8 h-8 text-stone-300" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="px-3 py-2.5">
                  <p className="text-sm font-semibold truncate">{ins.concept_name || "Untitled"}</p>
                  {ins.party?.name && (
                    <p className="text-xs text-stone-500 mt-0.5 truncate">{ins.party.name}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    {ins.design_count && (
                      <span className="text-xs text-amber-700 font-medium">{ins.design_count} designs</span>
                    )}
                    {ins.sketches?.length > 0 && (
                      <span className="text-xs text-stone-400 flex items-center gap-0.5">
                        <Layers className="w-3 h-3" />{ins.sketches.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1">
                    {format(new Date(ins.created_at), "dd MMM yyyy")}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
