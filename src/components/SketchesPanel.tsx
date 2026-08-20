"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Pencil, X, Plus, Loader2 } from "lucide-react";
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

export function SketchesPanel({ dssrId, initialSketches }: { dssrId: string; initialSketches: Sketch[] }) {
  const supabase = createClient();
  const [sketches, setSketches] = useState(initialSketches);
  const [editingDesignNo, setEditingDesignNo] = useState<string | null>(null);
  const [designNoValue, setDesignNoValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveDesignNo(sketchId: string) {
    setSaving(true);
    const { error } = await supabase.from("sketches")
      .update({ design_number: designNoValue || null, punch_status: designNoValue ? "Punched" : "Pending" })
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

  async function linkSketch(sketchId: string) {
    const { error } = await supabase.from("sketches").update({ dssr_id: dssrId }).eq("id", sketchId);
    if (!error) window.location.reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Sketches in this folder ({sketches.length})
        </h2>
        <Link href={`/sketches/new?dssr=${dssrId}`}
          className="text-xs font-semibold text-amber-700 flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Sketch
        </Link>
      </div>

      {sketches.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-stone-200 rounded-2xl">
          <p className="text-sm text-stone-400 mb-2">No sketches in this folder yet</p>
          <Link href={`/sketches/new?dssr=${dssrId}`}
            className="inline-block bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
            + Add first sketch
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sketches.map((s) => {
            const photoUrl = s.photo_path ? `${SUPABASE_URL}/storage/v1/object/public/sketch-files/${s.photo_path}` : null;
            return (
              <div key={s.id} className="bg-white border border-stone-200 rounded-xl p-3 flex items-center gap-3">
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-stone-100 shrink-0 flex items-center justify-center">
                  {photoUrl ? <img src={photoUrl} alt={s.sketch_number || ""} className="w-full h-full object-cover" /> : <span className="text-xl">✏️</span>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{s.sketch_number || "Untitled"}</p>
                  {s.description && <p className="text-xs text-stone-400 truncate">{s.description}</p>}

                  {/* Design number assignment */}
                  {editingDesignNo === s.id ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        autoFocus
                        value={designNoValue}
                        onChange={(e) => setDesignNoValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveDesignNo(s.id)}
                        placeholder="Enter design number..."
                        className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-600"
                      />
                      <button onClick={() => saveDesignNo(s.id)} disabled={saving} className="text-amber-600 p-1">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => setEditingDesignNo(null)} className="text-stone-400 p-1">
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
                        <span className="text-xs text-stone-400 italic">No design no. yet</span>
                      )}
                      <button
                        onClick={() => { setEditingDesignNo(s.id); setDesignNoValue(s.design_number || ""); }}
                        className="text-stone-400 hover:text-amber-600"
                        title="Assign design number"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Punch status */}
                <div className="shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    s.punch_status === "Punched" ? "bg-green-100 text-green-700" :
                    s.punch_status === "Punching" ? "bg-blue-100 text-blue-700" :
                    "bg-stone-100 text-stone-500"
                  }`}>
                    {s.punch_status || "Pending"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
