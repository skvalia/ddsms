"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, ImageIcon, X } from "lucide-react";

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function EditInspirationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<{id:string;name:string}[]>([]);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [conceptName, setConceptName] = useState("");
  const [season, setSeason] = useState("");
  const [designCount, setDesignCount] = useState("");
  const [notes, setNotes] = useState("");
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const [{ data: insp }, { data: p }] = await Promise.all([
        supabase.from("inspirations").select("*").eq("id", params.id).maybeSingle(),
        supabase.from("parties").select("id, name").order("name"),
      ]);
      setParties(p ?? []);
      if (insp) {
        setConceptName(insp.concept_name || "");
        setPartyId(insp.party_id || null);
        setSeason(insp.season || "");
        setDesignCount(insp.design_count?.toString() || "");
        setNotes(insp.notes || "");
        if (insp.photo_path) {
          setExistingPhoto(`${SUPABASE_URL}/storage/v1/object/public/inspiration-files/${insp.photo_path}`);
        }
      }
      setLoading(false);
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
    if (!conceptName.trim()) { setError("Concept name is required"); return; }
    setError(null);
    setSaving(true);

    let photoPath: string | undefined = undefined;
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("inspiration-files").upload(path, photo);
      if (uploadError) { setError("Photo upload failed: " + uploadError.message); setSaving(false); return; }
      photoPath = path;
    }

    const updateData: Record<string, unknown> = {
      concept_name: conceptName.trim(),
      season: season || null,
      notes: notes || null,
      design_count: designCount ? parseInt(designCount) : null,
    };
    if (partyId) updateData.party_id = partyId;
    if (photoPath) updateData.photo_path = photoPath;

    const { error: err } = await supabase.from("inspirations").update(updateData).eq("id", params.id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/inspirations/${params.id}`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Inspiration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Photo</label>
          <div onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-200 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 overflow-hidden relative">
            {photoPreview ? (
              <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
            ) : existingPhoto ? (
              <img src={existingPhoto} alt="existing" className="w-full h-full object-cover" />
            ) : (
              <><ImageIcon className="w-8 h-8 text-stone-300 mb-2" /><p className="text-sm text-stone-400">Tap to change photo</p></>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <Field label="Concept Name *">
            <input value={conceptName} onChange={(e) => setConceptName(e.target.value)} className={INPUT} required />
          </Field>
          <Field label="Party">
            <select value={partyId || ""} onChange={(e) => setPartyId(e.target.value || null)} className={INPUT}>
              <option value="">Select party...</option>
              {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Season / Collection">
              <input value={season} onChange={(e) => setSeason(e.target.value)} className={INPUT} />
            </Field>
            <Field label="No. of Designs">
              <input type="number" value={designCount} onChange={(e) => setDesignCount(e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={INPUT + " resize-none"} />
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
