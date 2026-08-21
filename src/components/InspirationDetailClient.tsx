"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Upload, Loader2, X, Plus, UserCheck, User } from "lucide-react";

type Photo = { id: string; photo_path: string; caption: string | null };
type Sketch = { id: string; sketch_number: string | null; design_number: string | null; photo_path: string | null; status: string; punch_status: string | null };
type Artist = { id: string; name: string };

export function InspirationDetailClient({
  insp, sketches, photos, artists, userId, supabaseUrl,
}: {
  insp: any; sketches: Sketch[]; photos: Photo[]; artists: Artist[]; userId: string; supabaseUrl: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [localPhotos, setLocalPhotos] = useState(photos);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function photoUrl(path: string) {
    return `${supabaseUrl}/storage/v1/object/public/inspiration-files/${path}`;
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("inspiration-files").upload(path, file);
    if (!uploadErr) {
      const insertData: Record<string, unknown> = {
        inspiration_id: insp.id,
        photo_path: path,
        sort_order: localPhotos.length,
      };
      if (userId) insertData.created_by = userId;
      const { data } = await supabase.from("inspiration_photos").insert(insertData).select().single();
      if (data) setLocalPhotos(prev => [...prev, data as Photo]);
    }
    setUploading(false);
  }

  async function deletePhoto(photo: Photo) {
    if (!confirm("Delete this photo?")) return;
    await supabase.storage.from("inspiration-files").remove([photo.photo_path]);
    await supabase.from("inspiration_photos").delete().eq("id", photo.id);
    setLocalPhotos(prev => prev.filter(p => p.id !== photo.id));
  }

  async function assignSketcher(artistId: string) {
    setSaving(true);
    await supabase.from("inspirations").update({
      assigned_sketcher_id: artistId || null,
      sketcher_assigned_at: artistId ? new Date().toISOString() : null,
    }).eq("id", insp.id);
    setSaving(false);
    setAssigningId(null);
    router.refresh();
  }

  const assignedSketcher = insp.assigned_sketcher;
  const coverPhoto = insp.photo_path
    ? `${supabaseUrl}/storage/v1/object/public/inspiration-files/${insp.photo_path}`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/inspirations" className="text-sm text-stone-500">← Inspirations</Link>
        <Link href={`/inspirations/${insp.id}/edit`}
          className="text-sm font-semibold text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg">
          ✏️ Edit
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">{insp.concept_name}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-stone-500">
          {insp.party?.name && <span>👥 {insp.party.name}</span>}
          {insp.season && <span>📅 {insp.season}</span>}
          {insp.design_count && <span>🎨 {insp.design_count} designs planned</span>}
        </div>
        {insp.notes && <p className="mt-3 text-sm text-stone-600 bg-stone-50 rounded-xl px-4 py-3">{insp.notes}</p>}
      </div>

      {/* ── Assign Sketcher ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {assignedSketcher ? (
              <>
                <UserCheck className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm font-semibold">{assignedSketcher.name}</p>
                  <p className="text-xs text-green-600">Sketcher assigned</p>
                </div>
              </>
            ) : (
              <>
                <User className="w-4 h-4 text-stone-400" />
                <p className="text-sm text-stone-400 italic">Inspiration not assigned</p>
              </>
            )}
          </div>
          <button onClick={() => setAssigningId(assigningId ? null : "sketcher")}
            className="text-xs text-amber-700 font-semibold border border-amber-200 px-2.5 py-1 rounded-lg">
            {assignedSketcher ? "Change" : "Assign Sketcher"}
          </button>
        </div>
        {assigningId === "sketcher" && (
          <div className="mt-3">
            <select onChange={(e) => assignSketcher(e.target.value)} disabled={saving}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm">
              <option value="">Remove assignment</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id} selected={a.id === insp.assigned_sketcher_id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Reference Photos ── */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 mb-3">
          Reference Photos ({localPhotos.length + (coverPhoto ? 1 : 0)})
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {/* Cover photo */}
          {coverPhoto && (
            <button onClick={() => setLightbox(coverPhoto)}
              className="aspect-square rounded-xl overflow-hidden border border-stone-200">
              <img src={coverPhoto} alt="cover" className="w-full h-full object-cover" />
            </button>
          )}
          {/* Additional photos */}
          {localPhotos.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-xl overflow-hidden border border-stone-200">
              <button onClick={() => setLightbox(photoUrl(p.photo_path))} className="w-full h-full">
                <img src={photoUrl(p.photo_path)} alt="" className="w-full h-full object-cover" />
              </button>
              <button onClick={() => deletePhoto(p)}
                className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-red-500" />
              </button>
            </div>
          ))}
          {/* Upload button */}
          <label className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
              : <><Upload className="w-5 h-5 text-stone-400" /><span className="text-[10px] text-stone-400 mt-1">Add photo</span></>}
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
          </label>
        </div>
      </div>

      {/* ── Sketches ── */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
            Sketches ({sketches.length} of {insp.design_count || "?"} planned)
          </h2>
          <Link href={`/sketches/new?inspiration=${insp.id}`}
            className="text-sm font-semibold text-amber-700">
            + Add Sketch
          </Link>
        </div>

        {sketches.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {sketches.map((s) => {
              const sketchPhoto = s.photo_path
                ? `${supabaseUrl}/storage/v1/object/public/sketch-files/${s.photo_path}`
                : null;
              return (
                <Link key={s.id} href={`/sketches/${s.id}`}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-stone-100 flex items-center justify-center overflow-hidden">
                    {sketchPhoto
                      ? <img src={sketchPhoto} alt={s.sketch_number || ""} className="w-full h-full object-cover" />
                      : <span className="text-3xl">✏️</span>}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{s.sketch_number || "Untitled"}</p>
                    {s.design_number && <p className="text-xs text-amber-700 font-medium mt-0.5">{s.design_number}</p>}
                    <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      s.status === "Ready for DSSR" ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-600"
                    }`}>{s.status}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-2xl">
            <p className="text-sm text-stone-400 mb-2">No sketches yet</p>
            <Link href={`/sketches/new?inspiration=${insp.id}`}
              className="text-sm font-semibold text-amber-700">Add first sketch →</Link>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
