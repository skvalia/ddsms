"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Pencil, Check, X, Plus, Loader2 } from "lucide-react";

type JourneyItem = {
  type: "inspiration" | "sketch" | "sample";
  label: string;
  photoUrl?: string;
  designNumber?: string;
};

type DesignTracking = {
  id: string;
  design_number: string | null;
  status: string;
  notes: string | null;
  dssr?: { dssr_number: string; design_number: string | null };
  sketch?: { sketch_number: string | null; photo_path: string | null };
};

const DESIGN_STATUSES = ["Pending", "On Machine", "Done", "Issue", "Approved"];
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export function JourneyPanel({
  ssrId,
  journeyData,
  initialTracking,
  linkedDssrs,
  sampleFiles,
}: {
  ssrId: string;
  journeyData: JourneyItem[];
  initialTracking: DesignTracking[];
  linkedDssrs: any[];
  sampleFiles: any[];
}) {
  const supabase = createClient();
  const [tracking, setTracking] = useState(initialTracking);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [addingDssr, setAddingDssr] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function saveTracking(id: string) {
    setSaving(true);
    await supabase.from("ssr_design_tracking")
      .update({ status: editStatus, notes: editNotes || null, updated_at: new Date().toISOString() })
      .eq("id", id);
    setTracking(prev => prev.map(t => t.id === id ? { ...t, status: editStatus, notes: editNotes || null } : t));
    setEditingId(null);
    setSaving(false);
  }

  const samplePhotos = sampleFiles.filter((f: any) =>
    ["jpg","jpeg","png","webp"].includes(f.file_type?.toLowerCase() || "")
  );

  return (
    <div className="space-y-5">

      {/* ── Photo Journey ── */}
      {(journeyData.length > 0 || samplePhotos.length > 0) && (
        <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
            📸 Design Journey
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {journeyData.map((item, i) => (
              <div key={i} className="shrink-0 text-center">
                <button onClick={() => item.photoUrl && setLightbox(item.photoUrl)}
                  className="w-24 h-24 rounded-xl overflow-hidden bg-(--color-paper) border border-(--color-line) flex items-center justify-center">
                  {item.photoUrl
                    ? <img src={item.photoUrl} alt={item.label} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{item.type === "inspiration" ? "💡" : "✏️"}</span>}
                </button>
                <p className="text-[10px] text-(--color-ink-soft) mt-1 max-w-24 truncate">{item.label}</p>
                {item.designNumber && <p className="text-[10px] text-amber-700 font-medium">{item.designNumber}</p>}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  item.type === "inspiration" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"
                }`}>{item.type}</span>
              </div>
            ))}

            {/* Arrow separator */}
            {journeyData.length > 0 && samplePhotos.length > 0 && (
              <div className="shrink-0 flex items-center text-2xl text-(--color-ink-soft)">→</div>
            )}

            {/* Sample photos */}
            {samplePhotos.map((f: any) => (
              <div key={f.id} className="shrink-0 text-center">
                <button onClick={() => setLightbox(`${SUPABASE_URL}/storage/v1/object/public/ssr-files/${f.file_path}`)}
                  className="w-24 h-24 rounded-xl overflow-hidden bg-(--color-paper) border border-(--color-line)">
                  <img src={`${SUPABASE_URL}/storage/v1/object/public/ssr-files/${f.file_path}`}
                    alt="sample" className="w-full h-full object-cover" />
                </button>
                <p className="text-[10px] text-(--color-ink-soft) mt-1">Sample Photo</p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">final</span>
              </div>
            ))}
          </div>
          {journeyData.length === 0 && samplePhotos.length === 0 && (
            <p className="text-sm text-(--color-ink-soft) text-center py-4">
              Link this SSR to a DSSR with sketches to see the journey
            </p>
          )}
        </div>
      )}

      {/* ── Linked DSSRs ── */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft)">
            Linked DSSRs ({linkedDssrs.length})
          </h2>
        </div>
        {linkedDssrs.length === 0 ? (
          <p className="text-sm text-(--color-ink-soft)">No DSSRs linked yet.</p>
        ) : (
          <div className="space-y-2">
            {linkedDssrs.map((ld: any) => (
              <div key={ld.id} className="flex items-center justify-between bg-(--color-paper) rounded-xl px-3 py-2">
                <div>
                  <p className="text-sm font-semibold">{ld.dssr?.dssr_number}</p>
                  {ld.dssr?.design_number && <p className="text-xs text-(--color-ink-soft)">{ld.dssr.design_number}</p>}
                </div>
                <span className="text-xs text-(--color-ink-soft)">{ld.dssr?.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Design Tracking ── */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Design Tracking ({tracking.length} designs)
        </h2>
        {tracking.length === 0 ? (
          <p className="text-sm text-(--color-ink-soft)">
            No designs tracked yet. Add designs from the linked DSSRs above.
          </p>
        ) : (
          <div className="space-y-2">
            {tracking.map((t) => (
              <div key={t.id} className="border border-(--color-line) rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t.design_number || t.dssr?.dssr_number || "Design"}</p>
                    {t.dssr?.design_number && <p className="text-xs text-(--color-ink-soft)">{t.dssr.design_number}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {editingId === t.id ? (
                      <>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                          className="text-xs rounded-lg border border-(--color-line) px-2 py-1">
                          {DESIGN_STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                        <button onClick={() => saveTracking(t.id)} disabled={saving}
                          className="text-(--color-thread) p-1">
                          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-(--color-ink-soft) p-1">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.status === "Done" || t.status === "Approved" ? "bg-green-100 text-green-700" :
                          t.status === "Issue" ? "bg-red-100 text-red-700" :
                          t.status === "On Machine" ? "bg-blue-100 text-blue-700" :
                          "bg-stone-100 text-stone-600"
                        }`}>{t.status}</span>
                        <button onClick={() => { setEditingId(t.id); setEditStatus(t.status); setEditNotes(t.notes || ""); }}
                          className="text-(--color-ink-soft) hover:text-(--color-thread) p-1">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {editingId === t.id && (
                  <input value={editNotes} onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="w-full mt-2 rounded-lg border border-(--color-line) bg-(--color-paper) px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-(--color-thread)" />
                )}
                {t.notes && editingId !== t.id && (
                  <p className="text-xs text-(--color-ink-soft) mt-1 italic">{t.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white text-xl" onClick={() => setLightbox(null)}>✕</button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
