"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2, ImageIcon } from "lucide-react";

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function EditSketchPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [inspirations, setInspirations] = useState<{id:string;concept_name:string}[]>([]);
  const [sketchArtists, setSketchArtists] = useState<SelectOption[]>([]);
  const [inspirationId, setInspirationId] = useState<string | null>(null);
  const [sketchArtistId, setSketchArtistId] = useState<string | null>(null);
  const [sketchNumber, setSketchNumber] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("Draft");
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const [{ data: sketch }, { data: insp }, { data: artists }] = await Promise.all([
        supabase.from("sketches").select("*").eq("id", params.id).maybeSingle(),
        supabase.from("inspirations").select("id, concept_name").order("created_at", { ascending: false }),
        supabase.from("sketch_artists").select("id, name").order("name"),
      ]);
      setInspirations(insp ?? []);
      setSketchArtists(artists ?? []);
      if (sketch) {
        setSketchNumber(sketch.sketch_number || "");
        setInspirationId(sketch.inspiration_id || null);
        setSketchArtistId(sketch.sketch_artist_id || null);
        setDescription(sketch.description || "");
        setNotes(sketch.notes || "");
        setStatus(sketch.status || "Draft");
        if (sketch.photo_path) setExistingPhoto(`${SUPABASE_URL}/storage/v1/object/public/sketch-files/${sketch.photo_path}`);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true);

    let photoPath: string | undefined = undefined;
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("sketch-files").upload(path, photo);
      if (uploadError) { setError("Photo upload failed: " + uploadError.message); setSaving(false); return; }
      photoPath = path;
    }

    const updateData: Record<string, unknown> = {
      sketch_number: sketchNumber || null,
      description: description || null,
      notes: notes || null,
      status,
      inspiration_id: inspirationId || null,
      sketch_artist_id: sketchArtistId || null,
    };
    if (photoPath) updateData.photo_path = photoPath;

    const { error: err } = await supabase.from("sketches").update(updateData).eq("id", params.id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.back();
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Sketch</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Sketch Photo</label>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-200 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 overflow-hidden">
            {photoPreview ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
              : existingPhoto ? <img src={existingPhoto} alt="existing" className="w-full h-full object-cover" />
              : <><ImageIcon className="w-8 h-8 text-stone-300 mb-2" /><p className="text-sm text-stone-400">Tap to change photo</p></>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); } }} />
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <Field label="Linked Inspiration">
            <select value={inspirationId || ""} onChange={(e) => setInspirationId(e.target.value || null)} className={INPUT}>
              <option value="">None</option>
              {inspirations.map((i) => <option key={i.id} value={i.id}>{i.concept_name}</option>)}
            </select>
          </Field>
          <Field label="Sketch Number">
            <input value={sketchNumber} onChange={(e) => setSketchNumber(e.target.value)} className={INPUT} />
          </Field>
          <SearchableSelect label="Sketched By" table="sketch_artists"
            value={sketchArtistId} onChange={setSketchArtistId}
            options={sketchArtists} setOptions={setSketchArtists} />
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={INPUT + " resize-none"} />
          </Field>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={INPUT + " resize-none"} />
          </Field>
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={INPUT}>
              <option>Draft</option>
              <option>In Progress</option>
              <option>Ready for DSSR</option>
              <option>Completed</option>
            </select>
          </Field>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3"><p className="text-sm text-red-600">{error}</p></div>}

        <button type="submit" disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  );
}
