"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, Upload, X, ImageIcon } from "lucide-react";

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

import { Suspense } from "react";

function NewInspirationForm() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<{id:string;name:string}[]>([]);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [conceptName, setConceptName] = useState("");
  const [season, setSeason] = useState("");
  const [designCount, setDesignCount] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const { data: p } = await supabase.from("parties").select("id, name").order("name");
      setParties(p ?? []);
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

    let photoPath: string | null = null;

    // Upload photo if selected
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("inspiration-files")
        .upload(path, photo);
      if (uploadError) {
        setError("Photo upload failed: " + uploadError.message);
        setSaving(false);
        return;
      }
      photoPath = path;
    }

    // Insert using explicit column names to bypass schema cache
    const insertData: Record<string, unknown> = {
      concept_name: conceptName.trim(),
      season: season || null,
      notes: notes || null,
      photo_path: photoPath,
    };
    if (partyId) insertData.party_id = partyId;
    if (userId) insertData.created_by = userId;
    if (designCount) insertData.design_count = parseInt(designCount);

    const { data, error: insertError } = await supabase
      .from("inspirations")
      .insert(insertData)
      .select("id")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(`/inspirations/${data.id}`);
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">New Inspiration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Photo upload */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">
            Inspiration Photo
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-stone-200 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-amber-400 transition-colors overflow-hidden relative"
          >
            {photoPreview ? (
              <>
                <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={(e) => { e.stopPropagation(); setPhoto(null); setPhotoPreview(null); }}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                  <X className="w-4 h-4 text-stone-600" />
                </button>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-sm text-stone-400">Tap to upload inspiration photo</p>
                <p className="text-xs text-stone-300 mt-1">JPG, PNG, WEBP</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photo && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <Upload className="w-3.5 h-3.5" /> Change photo
            </button>
          )}
        </div>

        {/* Details */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Concept Details</h2>

          <Field label="Concept Name *">
            <input value={conceptName} onChange={(e) => setConceptName(e.target.value)}
              placeholder="e.g. Floral Allover, Geometric Border"
              className={INPUT} required />
          </Field>

          <Field label="Party">
            <select value={partyId || ""} onChange={(e) => setPartyId(e.target.value || null)}
              className={INPUT}>
              <option value="">Select party...</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Season / Collection">
              <input value={season} onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. Diwali 2025" className={INPUT} />
            </Field>
            <Field label="No. of Designs in Catalogue"
              hint="How many designs planned from this concept">
              <input type="number" value={designCount}
                onChange={(e) => setDesignCount(e.target.value)}
                placeholder="e.g. 5" className={INPUT} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Colour direction, style notes, customer brief..."
              className={INPUT + " resize-none"} />
          </Field>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Inspiration
        </button>
      </form>
    </div>
  );
}

export default function NewInspirationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <NewInspirationForm />
    </Suspense>
  );
}
