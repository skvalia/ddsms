"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Loader2, X, Plus, ImageIcon } from "lucide-react";

type PendingSketch = {
  file: File;
  preview: string;
  sketchNumber: string;
  description: string;
};

export default function BulkAddSketchesPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState("");
  const [inspiration, setInspiration] = useState<any>(null);
  const [pending, setPending] = useState<PendingSketch[]>([]);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [nextSketchNo, setNextSketchNo] = useState(1001);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");
      const [{ data: insp }, { data: lastSketch }] = await Promise.all([
        supabase.from("inspirations").select("id, concept_name, design_count").eq("id", params.id).maybeSingle(),
        supabase.from("sketches").select("sketch_number").order("created_at", { ascending: false }).limit(10),
      ]);
      setInspiration(insp);
      if (lastSketch && lastSketch.length > 0) {
        const nums = lastSketch.map((s: any) => parseInt(s.sketch_number?.replace(/\D/g, "") || "0")).filter((n: number) => !isNaN(n));
        if (nums.length > 0) setNextSketchNo(Math.max(...nums) + 1);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: FileList) {
    const newItems: PendingSketch[] = [];
    Array.from(files).forEach((file, i) => {
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
        sketchNumber: `SK-${nextSketchNo + pending.length + i}`,
        description: "",
      });
    });
    setPending(prev => [...prev, ...newItems]);
  }

  function remove(idx: number) {
    setPending(prev => prev.filter((_, i) => i !== idx));
  }

  function update(idx: number, key: keyof PendingSketch, value: string) {
    setPending(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p));
  }

  async function saveAll() {
    if (pending.length === 0) return;
    setSaving(true);
    let done = 0;
    for (const p of pending) {
      const ext = p.file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("sketch-files").upload(path, p.file);
      if (!uploadErr) {
        const insertData: Record<string, unknown> = {
          sketch_number: p.sketchNumber || null,
          description: p.description || null,
          inspiration_id: params.id,
          photo_path: path,
          status: "Draft",
        };
        if (userId) insertData.created_by = userId;
        await supabase.from("sketches").insert(insertData);
      }
      done++;
      setProgress(Math.round((done / pending.length) * 100));
    }
    setSaving(false);
    router.push(`/inspirations/${params.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add Sketches</h1>
        {inspiration && (
          <p className="text-sm text-stone-500 mt-1">
            For: <span className="font-semibold">{inspiration.concept_name}</span>
            {inspiration.design_count && <span className="ml-2 text-amber-700">({inspiration.design_count} designs planned)</span>}
          </p>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-400 transition-colors mb-4"
      >
        <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-sm font-semibold text-stone-600">Tap to select sketch photos</p>
        <p className="text-xs text-stone-400 mt-1">Select multiple photos at once</p>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); }} />
      </div>

      {pending.length > 0 && (
        <>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
            {pending.length} sketch{pending.length !== 1 ? "es" : ""} ready to upload
          </p>

          <div className="space-y-3 mb-6">
            {pending.map((p, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-2xl p-3 flex gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    value={p.sketchNumber}
                    onChange={(e) => update(idx, "sketchNumber", e.target.value)}
                    placeholder="Sketch number"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                  <input
                    value={p.description}
                    onChange={(e) => update(idx, "description", e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <button onClick={() => remove(idx)} className="text-stone-400 hover:text-red-500 shrink-0 mt-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {saving && (
            <div className="mb-4">
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-stone-500 mt-1 text-center">Uploading... {progress}%</p>
            </div>
          )}

          <button onClick={saveAll} disabled={saving}
            className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Upload {pending.length} Sketch{pending.length !== 1 ? "es" : ""}
          </button>
        </>
      )}
    </div>
  );
}
