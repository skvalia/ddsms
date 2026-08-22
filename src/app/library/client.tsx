"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function photoUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function Stage({ title, count, children, emoji }: { title: string; count: number; children: React.ReactNode; emoji: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-6">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 mb-3 w-full text-left">
        <span className="text-xs font-bold uppercase tracking-wider text-stone-400">{emoji} {title} ({count})</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
        <Link href={`/${title.toLowerCase()}`} onClick={e => e.stopPropagation()}
          className="ml-auto text-xs text-amber-700 font-medium">View all →</Link>
      </button>
      {open && <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">{children}</div>}
    </div>
  );
}

export function LibraryContent() {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [inspirations, setInspirations] = useState<any[]>([]);
  const [sketches, setSketches] = useState<any[]>([]);
  const [dssrs, setDssrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: i }, { data: s }, { data: d }] = await Promise.all([
        supabase.from("inspirations").select("id, concept_name, photo_path, party:parties(name)").order("created_at", { ascending: false }).limit(200),
        supabase.from("sketches").select("id, sketch_number, design_number, photo_path, status").order("created_at", { ascending: false }).limit(200),
        supabase.from("dssr").select("id, dssr_number, design_number, status, party:parties(name), files:dssr_files(file_path, file_type)").order("updated_at", { ascending: false }).limit(200),
      ]);
      setInspirations(i ?? []);
      setSketches(s ?? []);
      setDssrs(d ?? []);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredI = useMemo(() => {
    if (!search) return inspirations;
    const q = search.toLowerCase();
    return inspirations.filter(i => i.concept_name?.toLowerCase().includes(q) || i.party?.name?.toLowerCase().includes(q));
  }, [search, inspirations]);

  const filteredS = useMemo(() => {
    if (!search) return sketches;
    const q = search.toLowerCase();
    return sketches.filter(s => s.sketch_number?.toLowerCase().includes(q) || s.design_number?.toLowerCase().includes(q));
  }, [search, sketches]);

  const filteredD = useMemo(() => {
    if (!search) return dssrs;
    const q = search.toLowerCase();
    return dssrs.filter(d => d.dssr_number?.toLowerCase().includes(q) || d.design_number?.toLowerCase().includes(q) || d.party?.name?.toLowerCase().includes(q));
  }, [search, dssrs]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Design Library</h1>
      <p className="text-sm text-stone-500 mb-5">Visual overview across the full design pipeline</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search across inspirations, sketches, designs..."
          className="w-full rounded-xl border border-stone-200 bg-white pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"><X className="w-4 h-4" /></button>}
      </div>

      <Stage title="inspirations" count={filteredI.length} emoji="💡">
        {filteredI.map((insp: any) => (
          <Link key={insp.id} href={`/inspirations/${insp.id}`}
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
              {insp.photo_path ? <img src={photoUrl("inspiration-files", insp.photo_path)} alt={insp.concept_name} className="w-full h-full object-cover" /> : <span className="text-2xl">💡</span>}
            </div>
            <div className="px-2.5 py-2">
              <p className="text-xs font-semibold truncate">{insp.concept_name}</p>
              {insp.party?.name && <p className="text-[10px] text-stone-400 truncate">{insp.party.name}</p>}
            </div>
          </Link>
        ))}
      </Stage>

      <Stage title="sketches" count={filteredS.length} emoji="✏️">
        {filteredS.map((s: any) => (
          <Link key={s.id} href={`/sketches/${s.id}`}
            className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
              {s.photo_path ? <img src={photoUrl("sketch-files", s.photo_path)} alt={s.sketch_number} className="w-full h-full object-cover" /> : <span className="text-2xl">✏️</span>}
            </div>
            <div className="px-2.5 py-2">
              <p className="text-xs font-semibold truncate">{s.sketch_number || "Untitled"}</p>
              {s.design_number && <p className="text-[10px] text-amber-700 truncate">{s.design_number}</p>}
              <p className="text-[10px] text-stone-400">{s.status}</p>
            </div>
          </Link>
        ))}
      </Stage>

      <Stage title="dssr" count={filteredD.length} emoji="🎨">
        {filteredD.map((d: any) => {
          const imgFile = (d.files ?? []).find((f: any) => ["jpg","jpeg","png","webp"].includes(f.file_type?.toLowerCase() || ""));
          return (
            <Link key={d.id} href={`/dssr/${d.id}`}
              className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                {imgFile ? <img src={photoUrl("dssr-files", imgFile.file_path)} alt={d.design_number || d.dssr_number} className="w-full h-full object-cover" /> : <span className="text-2xl">🎨</span>}
              </div>
              <div className="px-2.5 py-2">
                <p className="text-xs font-semibold truncate">{d.design_number || d.dssr_number}</p>
                {d.party?.name && <p className="text-[10px] text-stone-400 truncate">{d.party.name}</p>}
                <p className="text-[10px] text-stone-400">{d.status}</p>
              </div>
            </Link>
          );
        })}
      </Stage>
    </div>
  );
}
