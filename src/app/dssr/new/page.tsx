"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2 } from "lucide-react";

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function NewDssrPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextNo, setNextNo] = useState("");
  const [userId, setUserId] = useState("");
  const [parties, setParties] = useState<SelectOption[]>([]);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [designNumber, setDesignNumber] = useState("");
  const [designType, setDesignType] = useState("");
  const [designer, setDesigner] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: p }, { data: lastDssr }] = await Promise.all([
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("dssr").select("dssr_number").order("created_at", { ascending: false }).limit(20),
      ]);

      setParties(p ?? []);

      // Auto-generate next DSSR number
      const nums = (lastDssr ?? [])
        .map((r: any) => parseInt(r.dssr_number?.replace(/\D/g, "") ?? ""))
        .filter((n: number) => !isNaN(n));
      if (nums.length > 0) setNextNo(`D${Math.max(...nums) + 1}`);
      else setNextNo("D1001");

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!designNumber.trim()) { setError("Design Number is required"); return; }
    setSaving(true);

    const { data, error: err } = await supabase.from("dssr").insert({
      dssr_number: nextNo,
      party_id: partyId,
      design_number: designNumber.trim(),
      design_type: designType || null,
      designer: designer || null,
      description: description || null,
      remarks: remarks || null,
      status: "New",
      created_by: userId,
    }).select().single();

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
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design Details</h2>

          <Field label="Design Number *">
            <input value={designNumber} onChange={(e) => setDesignNumber(e.target.value)}
              placeholder="e.g. KB-8-1007878" className={INPUT} required />
          </Field>

          <SearchableSelect label="Party" table="parties"
            value={partyId} onChange={setPartyId}
            options={parties} setOptions={setParties} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Design Type">
              <select value={designType} onChange={(e) => setDesignType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600">
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
                placeholder="Name" className={INPUT} />
            </Field>
          </div>

          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Brief description of the design..."
              className={INPUT + " resize-none"} />
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
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Design Record
        </button>
      </form>
    </div>
  );
}
