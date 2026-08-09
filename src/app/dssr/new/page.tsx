"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2, Search, Check, X } from "lucide-react";

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

function NewDssrForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextNo, setNextNo] = useState("");
  const [userId, setUserId] = useState("");

  const [parties, setParties] = useState<SelectOption[]>([]);
  const [designTypes, setDesignTypes] = useState<SelectOption[]>([]);
  const [designers, setDesigners] = useState<SelectOption[]>([]);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [designTypeId, setDesignTypeId] = useState<string | null>(null);
  const [designerId, setDesignerId] = useState<string | null>(null);
  const [designNumber, setDesignNumber] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");
  const [sketchId, setSketchId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: p }, { data: dt }, { data: des }, { data: lastDssr }, { data: pendingCounts }] = await Promise.all([
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("design_types").select("id, name").order("name"),
        supabase.from("designers").select("id, name").order("name"),
        supabase.from("dssr").select("dssr_number").order("created_at", { ascending: false }).limit(20),
        supabase.from("dssr").select("designer_id").not("designer_id", "is", null).in("status", ["New", "CAD Development", "EMB Development"]),
      ]);

      setParties(p ?? []);
      setDesignTypes(dt ?? []);

      // Count pending work per designer
      const pendingMap: Record<string, number> = {};
      (pendingCounts ?? []).forEach((r: any) => {
        if (r.designer_id) pendingMap[r.designer_id] = (pendingMap[r.designer_id] || 0) + 1;
      });
      setDesigners((des ?? []).map((d: any) => ({
        id: d.id,
        name: d.name,
        badge: pendingMap[d.id] ? String(pendingMap[d.id]) : undefined,
      })));

      const nums = (lastDssr ?? [])
        .map((r: any) => parseInt(r.dssr_number?.replace(/\D/g, "") ?? ""))
        .filter((n: number) => !isNaN(n));
      setNextNo(nums.length > 0 ? `D${Math.max(...nums) + 1}` : "D1001");

      const sketchParam = params.get("sketch");
      if (sketchParam) setSketchId(sketchParam);

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const insertData: Record<string, unknown> = {
      dssr_number: nextNo,
      design_number: designNumber.trim() || null,
      description: description || null,
      remarks: remarks || null,
      status: "New",
    };
    if (partyId) insertData.party_id = partyId;
    if (designTypeId) {
      const dt = designTypes.find(d => d.id === designTypeId);
      if (dt) insertData.design_type = dt.name;
    }
    if (designerId) insertData.designer_id = designerId;
    if (sketchId) insertData.sketch_id = sketchId;
    if (userId) insertData.created_by = userId;

    const { data, error: err } = await supabase
      .from("dssr").insert(insertData).select("id").single();

    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("activity_logs").insert({
      entity_type: "dssr", entity_id: data.id,
      action: "created", description: `DSSR ${nextNo} created`,
      created_by: userId,
    });

    router.push(`/dssr/${data.id}`);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">New Design (DSSR)</h1>
        <p className="text-sm text-stone-500 mt-1">
          DSSR Number: <span className="font-semibold text-amber-700">{nextNo}</span>
          {sketchId && <span className="ml-2 text-green-600 font-medium">✓ Linked to sketch</span>}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design Details</h2>

          <Field label="Design Number"
            hint="Leave blank — filled in AFTER designer completes the CAD">
            <input value={designNumber} onChange={(e) => setDesignNumber(e.target.value)}
              placeholder="e.g. KB-8-1007878 — add later" className={INPUT} />
          </Field>

          <SearchableSelect label="Party" table="parties"
            value={partyId} onChange={setPartyId}
            options={parties} setOptions={setParties} />

          <SearchableSelect label="Design Type" table="design_types"
            value={designTypeId} onChange={setDesignTypeId}
            options={designTypes} setOptions={setDesignTypes}
            placeholder="e.g. Allover, Border, Placement..." />

          <SearchableSelect label="Assigned Designer" table="designers"
            value={designerId} onChange={setDesignerId}
            options={designers} setOptions={setDesigners}
            placeholder="Select or add designer..."
            hint="Badge shows their current pending work count" />

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Brief description..." className={INPUT + " resize-none"} />
          </Field>

          <Field label="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)}
              rows={2} className={INPUT + " resize-none"} />
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
          Create Design Record
        </button>
      </form>
    </div>
  );
}

export default function NewDssrPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}>
      <NewDssrForm />
    </Suspense>
  );
}
