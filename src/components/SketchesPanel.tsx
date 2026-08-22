"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Pencil, X, Plus, Loader2, Search, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

type Sketch = {
  id: string;
  sketch_number: string | null;
  design_number: string | null;
  description: string | null;
  photo_path: string | null;
  status: string;
  punch_status: string | null;
};

export function SketchesPanel({ dssrId, initialSketches }: {
  dssrId: string;
  initialSketches: Sketch[];
}) {
  const supabase = createClient();
  const [sketches, setSketches] = useState(initialSketches);
  const [editingDesignNo, setEditingDesignNo] = useState<string | null>(null);
  const [designNoValue, setDesignNoValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Add existing sketch
  const [showAddExisting, setShowAddExisting] = useState(false);
  const [allSketches, setAllSketches] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingAll, setLoadingAll] = useState(false);
  const [linking, setLinking] = useState(false);

  async function loadAllSketches() {
    setLoadingAll(true);
    const { data } = await supabase
      .from("sketches")
      .select("id, sketch_number, design_number, photo_path, status, inspiration:inspirations(concept_name)")
      .order("created_at", { ascending: false })
      .limit(200);
    // Filter out already linked ones
    const linkedIds = sketches.map(s => s.id);
    setAllSketches((data ?? []).filter((s: any) => !linkedIds.includes(s.id)));
    setLoadingAll(false);
  }

  async function linkSketch(sketchId: string) {
    setLinking(true);
    const { error } = await supabase
      .from("sketches")
      .update({ dssr_id: dssrId })
      .eq("id", sketchId);
    if (!error) {
      const linked = allSketches.find(s => s.id === sketchId);
      if (linked) {
        setSketches(prev => [...prev, {
          id: linked.id,
          sketch_number: linked.sketch_number,
          design_number: linked.design_number,
          description: null,
          photo_path: linked.photo_path,
          status: linked.status,
          punch_status: null,
        }]);
        setAllSketches(prev => prev.filter(s => s.id !== sketchId));
      }
    }
    setLinking(false);
  }

  async function unlinkSketch(sketchId: string) {
    if (!confirm("Remove this sketch from this DSSR?")) return;
    await supabase.from("sketches").update({ dssr_id: null }).eq("id", sketchId);
    setSketches(prev => prev.filter(s => s.id !== sketchId));
  }

  async function saveDesignNo(sketchId: string) {
    setSaving(true);
    const { error } = await supabase.from("sketches")
      .update({
        design_number: designNoValue || null,
        punch_status: designNoValue ? "Punched" : "Pending"
      })
      .eq("id", sketchId);
    if (!error) {
      setSketches(prev => prev.map(s => s.id === sketchId
        ? { ...s, design_number: designNoValue || null, punch_status: designNoValue ? "Punched" : "Pending" }
        : s
      ));
      setEditingDesignNo(null);
    }
    setSaving(false);
  }

  const filtered = allSketches.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.sketch_number?.toLowerCase().includes(q) ||
      s.inspiration?.concept_name?.toLowerCase().includes(q) ||
      s.design_number?.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-(--color-ink-soft)">
          ✏️ Input Sketches ({sketches.length})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowAddExisting(v => !v); if (!allSketches.length) loadAllSketches(); }}
            className="text-xs font-semibold text-(--color-thread) border border-(--color-thread-soft) px-2.5 py-1 rounded-lg flex items-center gap-1">
            <LinkIcon className="w-3 h-3" /> Link Existing
          </button>
          <Link href={`/sketches/new?dssr=${dssrId}`}
            className="text-xs font-semibold text-(--color-thread) border border-(--color-thread-soft) px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Plus className="w-3 h-3" /> New Sketch
          </Link>
        </div>
      </div>

      {/* Add existing sketch panel */}
      {showAddExisting && (
        <div className="mb-4 bg-(--color-paper) border border-(--color-line) rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-(--color-ink-soft)" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search sketches by number or concept..."
                className="w-full rounded-lg border border-(--color-line) bg-white pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
              />
            </div>
            <button onClick={() => setShowAddExisting(false)} className="text-(--color-ink-soft)">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loadingAll ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-(--color-ink-soft)" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-(--color-ink-soft) text-center py-3">
              {searchQuery ? "No sketches match your search" : "All sketches are already linked"}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {filtered.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between bg-white border border-(--color-line) rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {s.photo_path && (
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <img src={`${SUPABASE_URL}/storage/v1/object/public/sketch-files/${s.photo_path}`}
                          alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.sketch_number || "Untitled"}</p>
                      {s.inspiration?.concept_name && (
                        <p className="text-xs text-(--color-ink-soft) truncate">{s.inspiration.concept_name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => linkSketch(s.id)}
                    disabled={linking}
                    className="shrink-0 ml-2 text-xs font-semibold text-(--color-thread) bg-(--color-thread-soft) px-2.5 py-1 rounded-lg disabled:opacity-50">
                    {linking ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Linked sketches */}
      {sketches.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-(--color-line) rounded-2xl">
          <p className="text-sm text-(--color-ink-soft) mb-2">No input sketches yet</p>
          <p className="text-xs text-(--color-ink-soft)">Link existing sketches or create a new one</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sketches.map((s) => {
            const photoUrl = s.photo_path
              ? `${SUPABASE_URL}/storage/v1/object/public/sketch-files/${s.photo_path}`
              : null;
            return (
              <div key={s.id} className="bg-white border border-(--color-line) rounded-xl p-3 flex items-center gap-3">
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-(--color-paper) border border-(--color-line) shrink-0 flex items-center justify-center">
                  {photoUrl
                    ? <img src={photoUrl} alt={s.sketch_number || ""} className="w-full h-full object-cover" />
                    : <span className="text-xl">✏️</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.sketch_number || "Untitled"}</p>
                  {s.description && <p className="text-xs text-(--color-ink-soft) truncate">{s.description}</p>}

                  {/* Design number assignment */}
                  {editingDesignNo === s.id ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        autoFocus
                        value={designNoValue}
                        onChange={(e) => setDesignNoValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveDesignNo(s.id)}
                        placeholder="Enter design number..."
                        className="flex-1 rounded-lg border border-(--color-line) bg-(--color-paper) px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
                      />
                      <button onClick={() => saveDesignNo(s.id)} disabled={saving} className="text-(--color-thread) p-1">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingDesignNo(null)} className="text-(--color-ink-soft) p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      {s.design_number ? (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          {s.design_number}
                        </span>
                      ) : (
                        <span className="text-xs text-(--color-ink-soft) italic">No design no. yet</span>
                      )}
                      <button
                        onClick={() => { setEditingDesignNo(s.id); setDesignNoValue(s.design_number || ""); }}
                        className="text-(--color-ink-soft) hover:text-(--color-thread)"
                        title="Assign design number">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Punch status + unlink */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    s.punch_status === "Punched" ? "bg-green-100 text-green-700" :
                    "bg-stone-100 text-stone-500"
                  }`}>
                    {s.punch_status || "Pending"}
                  </span>
                  <button
                    onClick={() => unlinkSketch(s.id)}
                    className="text-(--color-ink-soft) hover:text-red-500"
                    title="Remove from this DSSR">
                    <X className="w-3 h-3" />
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
