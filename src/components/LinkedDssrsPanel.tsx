"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Search, Plus, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";

export function LinkedDssrsPanel({ ssrId, initialLinked }: {
  ssrId: string;
  initialLinked: any[];
}) {
  const supabase = createClient();
  const [linked, setLinked] = useState(initialLinked);
  const [showSearch, setShowSearch] = useState(false);
  const [allDssrs, setAllDssrs] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(true);

  async function loadDssrs() {
    setLoading(true);
    const linkedIds = linked.map((l: any) => l.dssr_id || l.dssr?.id);
    const { data } = await supabase
      .from("dssr")
      .select("id, dssr_number, design_number, status, machine_type, party:parties(name)")
      .order("created_at", { ascending: false })
      .limit(300);
    setAllDssrs((data ?? []).filter((d: any) => !linkedIds.includes(d.id)));
    setLoading(false);
  }

  async function linkDssr(dssrId: string) {
    setAdding(true);
    const { error } = await supabase.from("ssr_dssrs").insert({
      ssr_id: ssrId,
      dssr_id: dssrId,
    });
    if (!error) {
      const dssr = allDssrs.find(d => d.id === dssrId);
      if (dssr) {
        setLinked(prev => [...prev, { dssr_id: dssrId, dssr }]);
        setAllDssrs(prev => prev.filter(d => d.id !== dssrId));
      }
    }
    setAdding(false);
  }

  async function unlinkDssr(dssrId: string) {
    if (!confirm("Remove this DSSR from this sample?")) return;
    await supabase.from("ssr_dssrs").delete()
      .eq("ssr_id", ssrId).eq("dssr_id", dssrId);
    setLinked(prev => prev.filter((l: any) => (l.dssr_id || l.dssr?.id) !== dssrId));
  }

  const filtered = allDssrs.filter(d => {
    if (!query) return true;
    const q = query.toLowerCase();
    return d.dssr_number?.toLowerCase().includes(q) ||
      d.design_number?.toLowerCase().includes(q) ||
      d.party?.name?.toLowerCase().includes(q);
  });

  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft)">
            Linked Design Folders / DSSR ({linked.length})
          </h2>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-(--color-ink-soft)" />
                : <ChevronDown className="w-3.5 h-3.5 text-(--color-ink-soft)" />}
        </button>
        <button
          onClick={() => { setShowSearch(v => !v); if (!allDssrs.length) loadDssrs(); }}
          className="flex items-center gap-1 text-xs font-semibold text-(--color-thread) border border-(--color-thread-soft) px-2.5 py-1 rounded-lg">
          <Plus className="w-3 h-3" /> Link DSSR
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="mb-3 bg-(--color-paper) border border-(--color-line) rounded-xl p-3">
          <div className="flex gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--color-ink-soft)" />
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search DSSR number, design number, party..."
                className="w-full rounded-lg border border-(--color-line) bg-white pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)" />
            </div>
            <button onClick={() => setShowSearch(false)} className="text-(--color-ink-soft)">
              <X className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft) text-center py-3">No DSSRs available to link</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filtered.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between bg-white border border-(--color-line) rounded-lg px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{d.dssr_number}</p>
                    <p className="text-xs text-(--color-ink-soft) truncate">
                      {d.design_number && <span className="mr-2">{d.design_number}</span>}
                      {d.party?.name && <span>{d.party.name}</span>}
                      {d.machine_type && <span className="ml-2 text-amber-600">🔧 {d.machine_type}</span>}
                    </p>
                  </div>
                  <button onClick={() => linkDssr(d.id)} disabled={adding}
                    className="shrink-0 ml-2 text-xs font-semibold text-(--color-thread) bg-(--color-thread-soft) px-2.5 py-1 rounded-lg disabled:opacity-50">
                    {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : "Link"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked DSSRs list */}
      {open && (
        <div className="space-y-2">
          {linked.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft)">No DSSRs linked yet. Click "Link DSSR" to add.</p>
          ) : linked.map((l: any) => {
            const d = l.dssr || l;
            const dssrId = l.dssr_id || d.id;
            return (
              <div key={dssrId} className="flex items-center justify-between bg-(--color-paper) border border-(--color-line) rounded-xl px-3 py-2.5">
                <Link href={`/dssr/${dssrId}`} className="flex-1 min-w-0">
                  <p className="text-sm font-semibold hover:text-(--color-thread)">
                    {d.dssr_number || d.dssr?.dssr_number}
                  </p>
                  <p className="text-xs text-(--color-ink-soft) truncate">
                    {(d.design_number || d.dssr?.design_number) && <span className="mr-2">{d.design_number || d.dssr?.design_number}</span>}
                    {(d.party?.name || d.dssr?.party?.name) && <span>{d.party?.name || d.dssr?.party?.name}</span>}
                    {(d.machine_type || d.dssr?.machine_type) && <span className="ml-2">🔧 {d.machine_type || d.dssr?.machine_type}</span>}
                  </p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {d.status || d.dssr?.status}
                  </span>
                  <button onClick={() => unlinkDssr(dssrId)}
                    className="text-(--color-ink-soft) hover:text-red-500 p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
