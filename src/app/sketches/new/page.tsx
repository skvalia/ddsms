"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2, ImageIcon, X } from "lucide-react";

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function NewSketchForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [inspirations, setInspirations] = useState<{id:string;concept_name:string}[]>([]);
  const [dssrs, setDssrs] = useState<{id:string;dssr_number:string;design_type:string|null}[]>([]);
  const [sketchArtists, setSketchArtists] = useState<SelectOption[]>([]);
  const [inspirationId, setInspirationId] = useState<string | null>(null);
  const [dssrId, setDssrId] = useState<string | null>(null);
  const [sketchArtistId, setSketchArtistId] = useState<string | null>(null);
  const [sketchNumber, setSketchNumber] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Draft");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: insp }, { data: dssrList }, { data: artists }, { data: pendingCounts }, { data: last }] = await Promise.all([
        supabase.from("inspirations").select("id, concept_name").order("created_at", { ascending: false }),
        supabase.from("dssr").select("id, dssr_number, design_type").order("created_at", { ascending: false }),
        supabase.from("sketch_artists").select("id, name").order("name"),
        supabase.from("sketches").select("sketch_artist_id").not("sketch_artist_id", "is", null).in("status", ["Draft", "In Progress"]),
        supabase.from("sketches").select("sketch_number").order("created_at", { ascending: false }).limit(1),
      ]);

      setInspirations(insp ?? []);
      setDssrs((dssrList as any) ?? []);

      // Count pending sketches per artist
      const pendingMap: Record<string, number> = {};
      (pendingCounts ?? []).forEach((r: any) => {
        if (r.sketch_artist_id) pendingMap[r.sketch_artist_id] = (pendingMap[r.sketch_artist_id] || 0) + 1;
      });
      setSketchArtists((artists ?? []).map((a: any) => ({
        id: a.id, name: a.name,
        badge: pendingMap[a.id] ? String(pendingMap[a.id]) : undefined,
      })));

      const inspParam = params.get("inspiration");
      if (inspParam) setInspirationId(inspParam);
      const dssrParam = params.get("dssr");
      if (dssrParam) setDssrId(dssrParam);

      // Auto-generate sketch number
      if (last && last.length > 0 && last[0].sketch_number) {
        const num = parseInt(last[0].sketch_number.replace(/\D/g, ""));
        setSketchNumber(!isNaN(num) ? `SK-${num + 1}` : "SK-1001");
      } else {
        setSketchNumber("SK-1001");
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    let photoPath: string | null = null;
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("sketch-files").upload(path, photo);
      if (uploadError) { setError("Photo upload failed: " + uploadError.message); setSaving(false); return; }
      photoPath = path;
    }

    const insertData: Record<string, unknown> = {
      sketch_number: sketchNumber || null,
      description: description || null,
      notes: notes || null,
      status,
      photo_path: photoPath,
    };
    if (inspirationId) insertData.inspiration_id = inspirationId;
    if (dssrId) insertData.dssr_id = dssrId;
    if (sketchArtistId) insertData.sketch_artist_id = sketchArtistId;
    if (userId) insertData.created_by = userId;

    const { error: insertError } = await supabase.from("sketches").insert(insertData).select("id").single();
    if (insertError) { setError(insertError.message); setSaving(false); return; }

    if (dssrId) router.push(`/dssr/${dssrId}`);
    else if (inspirationId) router.push(`/inspirations/${inspirationId}`);
    else router.push("/sketches");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-6">New Sketch</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Sketch Photo</label>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-200 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors overflow-hidden relative">
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button" onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-sm text-stone-400">Tap to upload sketch photo</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Details */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Sketch Details</h2>

          <Field label="Linked DSSR — optional">
            <select value={dssrId || ""} onChange={(e) => setDssrId(e.target.value || null)} className={INPUT}>
              <option value="">No DSSR linked</option>
              {dssrs.map((d) => (
                <option key={d.id} value={d.id}>{d.dssr_number}{d.design_type ? ` — ${d.design_type}` : ""}</option>
              ))}
            </select>
          </Field>

          <Field label="Linked Inspiration — optional">
            <select value={inspirationId || ""} onChange={(e) => setInspirationId(e.target.value || null)} className={INPUT}>
              <option value="">Select inspiration...</option>
              {inspirations.map((i) => <option key={i.id} value={i.id}>{i.concept_name}</option>)}
            </select>
          </Field>

          <Field label="Sketch Number">
            <input value={sketchNumber} onChange={(e) => setSketchNumber(e.target.value)} className={INPUT} />
          </Field>

          <SearchableSelect label="Sketched By" table="sketch_artists"
            value={sketchArtistId} onChange={setSketchArtistId}
            options={sketchArtists} setOptions={setSketchArtists}
            placeholder="Select or add sketch artist..."
            hint="Badge shows their current pending sketches" />

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} className={INPUT + " resize-none"} />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} className={INPUT + " resize-none"} />
          </Field>

          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={INPUT}>
              <option>Draft</option>
              <option>Ready for DSSR</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </Field>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}

        <button type="submit" disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Sketch
        </button>
      </form>
    </div>
  );
}

export default function NewSketchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}>
      <NewSketchForm />
    </Suspense>
  );
}
