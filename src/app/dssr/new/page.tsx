"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2, Upload, X, FileText, Search, Check } from "lucide-react";

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

function SketchPicker({ value, onChange, sketches }: {
  value: string | null;
  onChange: (id: string | null) => void;
  sketches: any[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = sketches.find((s) => s.id === value);
  const filtered = sketches.filter((s) =>
    [s.sketch_number, s.description].some((v) => v?.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
        Linked Sketch <span className="font-normal normal-case text-stone-400">— optional</span>
      </label>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-600">
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected ? `${selected.sketch_number}${selected.description ? ` — ${selected.description}` : ""}` : "Select sketch..."}
        </span>
        <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-56 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search sketches..." className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none" />
          </div>
          <div className="overflow-y-auto flex-1">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-50">No link</button>
            {filtered.map((sk) => (
              <button key={sk.id} type="button"
                onClick={() => { onChange(sk.id); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between">
                <span>
                  <span className="font-medium">{sk.sketch_number}</span>
                  {sk.description && <span className="text-stone-400 ml-2">{sk.description}</span>}
                </span>
                {sk.id === value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            ))}
            {filtered.length === 0 && query && (
              <p className="px-3 py-2 text-sm text-stone-400">No sketches found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewDssrPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextNo, setNextNo] = useState("");
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<SelectOption[]>([]);
  const [sketches, setSketches] = useState<any[]>([]);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [sketchId, setSketchId] = useState<string | null>(null);
  const [designType, setDesignType] = useState("");
  const [designer, setDesigner] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [instructions, setInstructions] = useState<File[]>([]);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: p }, { data: sk }, { data: lastDssr }] = await Promise.all([
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("sketches").select("id, sketch_number, description, status").order("created_at", { ascending: false }),
        supabase.from("dssr").select("dssr_number").order("created_at", { ascending: false }).limit(20),
      ]);

      setParties(p ?? []);
      setSketches(sk ?? []);

      const nums = (lastDssr ?? [])
        .map((r: any) => parseInt(r.dssr_number?.replace(/\D/g, "") ?? ""))
        .filter((n: number) => !isNaN(n));
      setNextNo(nums.length > 0 ? `D${Math.max(...nums) + 1}` : "D1001");
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setInstructions((prev) => [...prev, ...files]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);

    // Create DSSR record first
    const { data, error: err } = await supabase.from("dssr").insert({
      dssr_number: nextNo,
      party_id: partyId,
      sketch_id: sketchId,
      design_type: designType || null,
      designer: designer || null,
      description: description || null,
      remarks: remarks || null,
      status: "New",
      created_by: userId,
      // Design number is NOT set here — filled later when designer completes
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }

    // Upload instruction files
    for (const file of instructions) {
      const ext = file.name.split(".").pop();
      const path = `${data.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("dssr-files").upload(path, file);
      if (!upErr) {
        await supabase.from("dssr_files").insert({
          dssr_id: data.id,
          file_path: path,
          file_name: file.name,
          file_type: file.type,
          stage: "Instructions",
          uploaded_by: userId,
        });
      }
    }

    await supabase.from("activity_logs").insert({
      entity_type: "dssr", entity_id: data.id,
      action: "created", description: `DSSR ${nextNo} created`,
      created_by: userId,
    });

    router.push(`/dssr/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Design (DSSR)</h1>
        <p className="text-sm text-stone-500 mt-1">
          DSSR Number: <span className="font-semibold text-amber-700">{nextNo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Sketch link + Party */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design Source</h2>
          <SketchPicker value={sketchId} onChange={setSketchId} sketches={sketches} />
          <SearchableSelect label="Party" table="parties"
            value={partyId} onChange={setPartyId}
            options={parties} setOptions={setParties} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Design Type">
              <select value={designType} onChange={(e) => setDesignType(e.target.value)} className={INPUT}>
                <option value="">Select type</option>
                <option>Allover</option>
                <option>Placement</option>
                <option>Border</option>
                <option>Corner</option>
                <option>Panel</option>
              </select>
            </Field>
            <Field label="Designer / Digitiser">
              <input value={designer} onChange={(e) => setDesigner(e.target.value)}
                placeholder="Who will digitise" className={INPUT} />
            </Field>
          </div>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Brief about the design..."
              className={INPUT + " resize-none"} />
          </Field>
          <Field label="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
              rows={2} className={INPUT + " resize-none"} />
          </Field>
        </div>

        {/* Instructions upload */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
            Instructions for Designer
          </h2>
          <p className="text-xs text-stone-400 mb-3">
            Attach photos, sketches, PDFs or any reference files for the designer
          </p>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-stone-200 rounded-xl py-6 flex flex-col items-center gap-2 text-stone-400 hover:border-amber-400 hover:text-amber-600 transition-colors">
            <Upload className="w-6 h-6" />
            <span className="text-sm font-medium">Upload instruction files</span>
            <span className="text-xs">Photos, PDFs, Word docs</span>
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx"
            onChange={handleFiles} className="hidden" />

          {instructions.length > 0 && (
            <div className="mt-3 space-y-2">
              {instructions.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-stone-50 rounded-lg px-3 py-2">
                  <FileText className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <button type="button"
                    onClick={() => setInstructions((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-stone-400 hover:text-red-500 p-0.5">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Design number note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-xs text-blue-700 font-medium">
            ✏️ <strong>Design Number</strong> (e.g. KB-8-1007878) will be assigned after the designer completes the CAD — add it from the DSSR detail page once ready.
          </p>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Design Record
        </button>
      </form>
    </div>
  );
}
