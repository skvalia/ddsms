"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2 } from "lucide-react";

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

export default function EditDssrPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parties, setParties] = useState<SelectOption[]>([]);
  const [designTypes, setDesignTypes] = useState<SelectOption[]>([]);
  const [designers, setDesigners] = useState<SelectOption[]>([]);
  const [machineTypes, setMachineTypes] = useState<SelectOption[]>([]);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [designTypeId, setDesignTypeId] = useState<string | null>(null);
  const [designerId, setDesignerId] = useState<string | null>(null);
  const [machineTypeId, setMachineTypeId] = useState<string | null>(null);
  const [yourRefNo, setYourRefNo] = useState("");
  const [designNumber, setDesignNumber] = useState("");
  const [description, setDescription] = useState("");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: dssr }, { data: p }, { data: dt }, { data: des }, { data: mt }] = await Promise.all([
        supabase.from("dssr").select("*").eq("id", params.id).maybeSingle(),
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("design_types").select("id, name").order("name"),
        supabase.from("designers").select("id, name").order("name"),
        supabase.from("machine_types").select("id, name").order("name"),
      ]);
      setParties(p ?? []);
      setMachineTypes(mt ?? []);

      // For design_types and designers, find by name match
      const dtList = dt ?? [];
      const desList = des ?? [];
      setDesignTypes(dtList);
      setDesigners(desList);

      if (dssr) {
        setYourRefNo(dssr.your_ref_no || "");
        setDesignNumber(dssr.design_number || "");
        setDescription(dssr.description || "");
        setRemarks(dssr.remarks || "");
        setPartyId(dssr.party_id || null);
        setDesignerId(dssr.designer_id || null);
        // Match by name for design_type and machine_type
        const dt_match = dtList.find((d: any) => d.name === dssr.design_type);
        if (dt_match) setDesignTypeId(dt_match.id);
        const mt_match = mt?.find((m: any) => m.name === dssr.machine_type);
        if (mt_match) setMachineTypeId(mt_match.id);
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const updateData: Record<string, unknown> = {
      your_ref_no: yourRefNo || null,
      design_number: designNumber || null,
      description: description || null,
      remarks: remarks || null,
    };
    if (partyId) updateData.party_id = partyId;
    if (designerId) updateData.designer_id = designerId;
    if (designTypeId) {
      const dt = designTypes.find(d => d.id === designTypeId);
      if (dt) updateData.design_type = dt.name;
    }
    if (machineTypeId) {
      const mt = machineTypes.find(m => m.id === machineTypeId);
      if (mt) updateData.machine_type = mt.name;
    }

    const { error: err } = await supabase.from("dssr").update(updateData).eq("id", params.id);
    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/dssr/${params.id}`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Design Folder</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Reference & Party</h2>
          <Field label="Your Reference No">
            <input value={yourRefNo} onChange={(e) => setYourRefNo(e.target.value)} placeholder="Your old folder number" className={INPUT} />
          </Field>
          <Field label="Design Number" hint="Fill in after designer completes CAD">
            <input value={designNumber} onChange={(e) => setDesignNumber(e.target.value)} placeholder="e.g. KB-8-1007878" className={INPUT} />
          </Field>
          <SearchableSelect label="Party" table="parties" value={partyId} onChange={setPartyId} options={parties} setOptions={setParties} />
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design Details</h2>
          <SearchableSelect label="Design Type" table="design_types" value={designTypeId} onChange={setDesignTypeId} options={designTypes} setOptions={setDesignTypes} />
          <SearchableSelect label="Machine Type" table="machine_types" value={machineTypeId} onChange={setMachineTypeId} options={machineTypes} setOptions={setMachineTypes} />
          <SearchableSelect label="Assigned Designer" table="designers" value={designerId} onChange={setDesignerId} options={designers} setOptions={setDesigners} />
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={INPUT + " resize-none"} />
          </Field>
          <Field label="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={INPUT + " resize-none"} />
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
