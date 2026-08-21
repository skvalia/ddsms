"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCheck, User } from "lucide-react";

export function SketchDetailClient({
  sketch, dssrs, designers, userId, supabaseUrl,
}: {
  sketch: any; dssrs: any[]; designers: any[]; userId: string; supabaseUrl: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [assigning, setAssigning] = useState(false);
  const [saving, setSaving] = useState(false);

  const photoUrl = sketch.photo_path
    ? `${supabaseUrl}/storage/v1/object/public/sketch-files/${sketch.photo_path}`
    : null;

  const assignedDesigner = sketch.assigned_designer;

  async function assignDesigner(designerId: string) {
    setSaving(true);
    await supabase.from("sketches").update({
      assigned_designer_id: designerId || null,
      designer_assigned_at: designerId ? new Date().toISOString() : null,
    }).eq("id", sketch.id);
    setSaving(false);
    setAssigning(false);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Breadcrumb + Edit */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-sm text-stone-400 flex-wrap">
          <Link href="/inspirations" className="hover:text-stone-600">Inspirations</Link>
          {sketch.inspiration && (
            <><span>→</span>
            <Link href={`/inspirations/${sketch.inspiration.id}`} className="hover:text-stone-600">
              {sketch.inspiration.concept_name}
            </Link></>
          )}
          <span>→</span>
          <span className="text-stone-700 font-medium">{sketch.sketch_number}</span>
        </div>
        <Link href={`/sketches/${sketch.id}/edit`}
          className="text-sm font-semibold text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg shrink-0">
          ✏️ Edit
        </Link>
      </div>

      {photoUrl && (
        <div className="rounded-2xl overflow-hidden mb-5 border border-stone-200">
          <img src={photoUrl} alt={sketch.sketch_number} className="w-full object-cover max-h-80" />
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{sketch.sketch_number || "Untitled Sketch"}</h1>
          <span className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium ${
            sketch.status === "Ready for DSSR" ? "bg-green-100 text-green-700" :
            sketch.status === "Completed" ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-600"
          }`}>{sketch.status}</span>
        </div>
        {sketch.design_number && (
          <p className="text-sm font-semibold text-amber-700 mt-1">Design No: {sketch.design_number}</p>
        )}
        {sketch.description && (
          <p className="mt-3 text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">{sketch.description}</p>
        )}
        {sketch.notes && <p className="mt-2 text-sm text-stone-500 italic px-1">{sketch.notes}</p>}
      </div>

      {/* ── Assign Designer ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignedDesigner ? (
              <>
                <UserCheck className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold">{assignedDesigner.name}</p>
                  <p className="text-xs text-green-600">Designer assigned</p>
                </div>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-stone-400" />
                <p className="text-sm text-stone-400 italic">Sketch not assigned</p>
              </>
            )}
          </div>
          <button onClick={() => setAssigning(!assigning)}
            className="text-xs text-amber-700 font-semibold border border-amber-200 px-2.5 py-1 rounded-lg">
            {assignedDesigner ? "Change" : "Assign Designer"}
          </button>
        </div>
        {assigning && (
          <div className="mt-3">
            <select onChange={(e) => assignDesigner(e.target.value)} disabled={saving}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
              <option value="">Remove assignment</option>
              {designers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── DSSR Records ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
            Design Records / DSSR ({dssrs.length})
          </h2>
          <Link href={`/dssr/new?sketch=${sketch.id}${sketch.inspiration ? `&inspiration=${sketch.inspiration.id}` : ""}`}
            className="bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
            + Create DSSR
          </Link>
        </div>

        {dssrs.length > 0 ? (
          <div className="space-y-2">
            {dssrs.map((d: any) => (
              <Link key={d.id} href={`/dssr/${d.id}`}
                className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                <div>
                  <p className="font-semibold text-sm">{d.dssr_number}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {d.machine_type && <span className="mr-2">🔧 {d.machine_type}</span>}
                    {d.party?.name && <span>{d.party.name}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{d.status}</span>
                  <span className="text-stone-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">
            <p className="text-sm text-stone-400 mb-1">No design record yet</p>
            <Link href={`/dssr/new?sketch=${sketch.id}`}
              className="inline-block mt-2 bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold">
              + Create DSSR from this sketch
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
