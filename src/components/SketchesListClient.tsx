"use client";
export const dynamic = "force-dynamic";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

export function SketchesListClient({ sketches, supabaseUrl }: { sketches: any[]; supabaseUrl: string }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const statuses = ["All", "Draft", "In Progress", "Ready for DSSR", "Completed"];

  const filtered = useMemo(() => {
    return sketches.filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        s.sketch_number?.toLowerCase().includes(q) ||
        s.inspiration?.concept_name?.toLowerCase().includes(q) ||
        s.design_number?.toLowerCase().includes(q) ||
        s.assigned_designer?.name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, sketches]);

  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sketches</h1>
          <p className="text-sm text-stone-500 mt-0.5">{filtered.length} of {sketches.length} sketches</p>
        </div>
        <Link href="/sketches/new" className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">+ New</Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sketch no, concept, design no, designer..."
            className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-4 h-4" /></button>}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm">
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400"><p className="text-4xl mb-3">✏️</p><p className="text-sm">No sketches found</p></div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filtered.map((s: any) => {
            const photoUrl = s.photo_path ? `${supabaseUrl}/storage/v1/object/public/sketch-files/${s.photo_path}` : null;
            return (
              <Link key={s.id} href={`/sketches/${s.id}`}
                className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                  {photoUrl ? <img src={photoUrl} alt={s.sketch_number} className="w-full h-full object-cover" /> : <span className="text-3xl">✏️</span>}
                </div>
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold truncate">{s.sketch_number || "Untitled"}</p>
                  {s.design_number && <p className="text-xs text-amber-700 font-medium truncate">{s.design_number}</p>}
                  <p className="text-xs text-stone-400 truncate">{s.inspiration?.concept_name || "—"}</p>
                  {s.assigned_designer
                    ? <p className="text-xs text-green-600 mt-0.5">✓ {s.assigned_designer.name}</p>
                    : <p className="text-xs text-amber-600 mt-0.5">⚠ Not assigned</p>}
                  <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    s.status === "Ready for DSSR" ? "bg-green-100 text-green-700" :
                    s.status === "Completed" ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-600"
                  }`}>{s.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
