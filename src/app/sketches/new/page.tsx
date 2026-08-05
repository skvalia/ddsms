"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, Upload, X, ImageIcon, Search, Check } from "lucide-react";

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

function InspirationPicker({ value, onChange, inspirations }: {
  value: string | null;
  onChange: (id: string | null, name?: string) => void;
  inspirations: any[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = inspirations.find((i) => i.id === value);
  const filtered = inspirations.filter((i) =>
    i.concept_name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
        Linked Inspiration <span className="font-normal normal-case text-stone-400">— optional</span>
      </label>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-600">
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected ? selected.concept_name : "Select inspiration..."}
        </span>
        <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-56 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts..." className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
          </div>
          <div className="overflow-y-auto flex-1">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-50">
              No link
            </button>
            {filtered.map((ins) => (
              <button key={ins.id} type="button"
                onClick={() => { onChange(ins.id, ins.concept_name); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between">
                {ins.concept_name}
                {ins.id === value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            ))}
          </div>
        </div>
      )}
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
  const [inspirations, setInspirations] = useState<any[]>([]);
  const [inspirationId, setInspirationId] = useState<string | null>(null);
  const [sketchNumber, setSketchNumber] = useState("");
  const [nextNo, setNextNo] = useState("");
  const [description, setDescription] = useState("");
  const [sketchedBy, setSketchedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: ins }, { data: lastSketch }] = await Promise.all([
        supabase.from("inspirations").select("id, concept_name").order("created_at", { ascending: false }),
        supabase.from("sketches").select("sketch_number").order("created_at", { ascending: false }).limit(20),
      ]);

      setInspirations(ins ?? []);

      // Auto number
      const nums = (lastSketch ?? [])
        .map((r: any) => parseInt(r.sketch_number?.replace(/\D/g, "") ?? ""))
        .filter((n: number) => !isNaN(n));
      const next = nums.length > 0 ? `SK-${Math.max(...nums) + 1}` : "SK-1001";
      setNextNo(next);
      setSketchNumber(next);

      // Pre-fill inspiration from URL param
      const insParam = params.get("inspiration");
      if (insParam) setInspirationId(insParam);
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
    setSaving(true); setError(null);

    let photoPath: string | null = null;
    if (photo) {
      const ext = photo.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("sketch-files").upload(path, photo);
      if (upErr) { setError(`Upload failed: ${upErr.message}`); setSaving(false); return; }
      photoPath = path;
    }

    const { data, error: err } = await supabase.from("sketches").insert({
      sketch_number: sketchNumber.trim() || nextNo,
      inspiration_id: inspirationId,
      description: description || null,
      sketched_by: sketchedBy || null,
      notes: notes || null,
      photo_path: photoPath,
      status: "Draft",
      created_by: userId,
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("activity_logs").insert({
      entity_type: "sketch", entity_id: data.id,
      action: "created", description: `Sketch ${sketchNumber} created`,
      created_by: userId,
    });

    router.push(`/sketches/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Sketch</h1>
        <p className="text-sm text-stone-500 mt-1">Sketch Number: <span className="font-semibold text-amber-700">{nextNo}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sketch photo */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">Sketch Photo</h2>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="sketch" className="w-full max-h-64 object-contain rounded-xl border border-stone-200" />
              <button type="button" onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow border border-stone-200">
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-stone-200 rounded-xl py-10 flex flex-col items-center gap-2 text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors">
              <ImageIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Tap to upload sketch</span>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Sketch Details</h2>

          <InspirationPicker value={inspirationId} onChange={setInspirationId} inspirations={inspirations} />

          <Field label="Sketch Number">
            <input value={sketchNumber} onChange={(e) => setSketchNumber(e.target.value)}
              placeholder={nextNo} className={INPUT} />
          </Field>

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="What this sketch shows — motif, style, placement..."
              className={INPUT + " resize-none"} />
          </Field>

          <Field label="Sketched By">
            <input value={sketchedBy} onChange={(e) => setSketchedBy(e.target.value)}
              placeholder="Name of person who sketched" className={INPUT} />
          </Field>

          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} placeholder="Additional notes..."
              className={INPUT + " resize-none"} />
          </Field>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

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
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}>
      <NewSketchForm />
    </Suspense>
  );
}
