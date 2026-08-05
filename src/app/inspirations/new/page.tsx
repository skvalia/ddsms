"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
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

export default function NewInspirationPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<SelectOption[]>([]);
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
    setSaving(true); setError(null);

    let photoPath: string | null = null;

    // Upload photo if provided
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("inspiration-files")
        .upload(path, photo);
      if (upErr) { setError(`Photo upload failed: ${upErr.message}`); setSaving(false); return; }
      photoPath = path;
    }

    const { data, error: err } = await supabase.from("inspirations").insert({
      concept_name: conceptName.trim(),
      party_id: partyId,
      season: season || null,
      design_count: designCount ? parseInt(designCount) : null,
      notes: notes || null,
      photo_path: photoPath,
      created_by: userId,
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("activity_logs").insert({
      entity_type: "inspiration", entity_id: data.id,
      action: "created", description: `Inspiration "${conceptName}" created`,
      created_by: userId,
    });

    router.push(`/inspirations/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">New Inspiration</h1>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Photo upload */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Inspiration Photo</h2>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="preview"
                className="w-full max-h-64 object-contain rounded-xl border border-stone-200" />
              <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-stone-200">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-10 flex flex-col items-center gap-2 text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to upload inspiration photo</span>
              <span className="text-xs">JPG, PNG, WEBP</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          {!photoPreview && (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 font-medium">
              <Upload className="w-3.5 h-3.5" /> Choose photo
            </button>
          )}
        </div>

        {/* Details */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Concept Details</h2>

          <Field label="Concept Name *">
            <input value={conceptName} onChange={(e) => setConceptName(e.target.value)}
              placeholder="e.g. Floral Allover Summer 2026" className={INPUT} required />
          </Field>

          <SearchableSelect label="Party" table="parties"
            value={partyId} onChange={setPartyId}
            options={parties} setOptions={setParties} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Season / Collection">
              <input value={season} onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. Summer 2026" className={INPUT} />
            </Field>
            <Field label="No. of Designs in Catalogue" hint="How many designs planned from this concept">
              <input type="number" value={designCount} onChange={(e) => setDesignCount(e.target.value)}
                placeholder="e.g. 6" className={INPUT} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} placeholder="Colour direction, style notes, customer brief..."
              className={INPUT + " resize-none"} />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Inspiration
        </button>
      </form>
    </div>
  );
}
