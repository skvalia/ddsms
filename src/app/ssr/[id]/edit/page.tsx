"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditSsrPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [parties, setParties] = useState<SelectOption[]>([]);
  const [fabrics, setFabrics] = useState<SelectOption[]>([]);
  const [yarns, setYarns] = useState<SelectOption[]>([]);

  const [partyId, setPartyId] = useState<string | null>(null);
  const [fabricId, setFabricId] = useState<string | null>(null);
  const [yarnFrontId, setYarnFrontId] = useState<string | null>(null);
  const [yarnBackId, setYarnBackId] = useState<string | null>(null);
  const [yourRefNo, setYourRefNo] = useState("");
  const [sampleNo, setSampleNo] = useState("");
  const [designNumber, setDesignNumber] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [machine, setMachine] = useState("");
  const [operator, setOperator] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dyeingRequired, setDyeingRequired] = useState(false);
  const [dyeingName, setDyeingName] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: ssr }, { data: p }, { data: f }, { data: y }] = await Promise.all([
        supabase.from("ssr").select("*").eq("id", params.id).maybeSingle(),
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("fabrics").select("id, name").order("name"),
        supabase.from("yarns").select("id, name").order("name"),
      ]);
      setParties(p ?? []);
      setFabrics(f ?? []);
      setYarns(y ?? []);

      if (ssr) {
        setPartyId(ssr.party_id || null);
        setFabricId(ssr.fabric_id || null);
        setYarnFrontId(ssr.yarn_front_id || null);
        setYarnBackId(ssr.yarn_back_id || null);
        setYourRefNo(ssr.your_ref_no || "");
        setSampleNo(ssr.sample_no || "");
        setDesignNumber(ssr.design_number || "");
        setSampleType(ssr.sample_type || "");
        setMachine(ssr.machine || "");
        setOperator(ssr.operator || "");
        setRemarks(ssr.remarks || "");
        setDyeingRequired(ssr.dyeing_required || false);
        setDyeingName(ssr.dyeing_name || "");
      }
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true);

    const { error: err } = await supabase.from("ssr").update({
      party_id: partyId || null,
      fabric_id: fabricId || null,
      yarn_front_id: yarnFrontId || null,
      yarn_back_id: yarnBackId || null,
      your_ref_no: yourRefNo || null,
      sample_no: sampleNo || null,
      design_number: designNumber || null,
      sample_type: sampleType || null,
      machine: machine || null,
      operator: operator || null,
      remarks: remarks || null,
      dyeing_required: dyeingRequired,
      dyeing_name: dyeingName || null,
    }).eq("id", params.id);

    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/ssr/${params.id}`);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Edit Sample (SSR)</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Reference</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your Ref No">
              <input value={yourRefNo} onChange={(e) => setYourRefNo(e.target.value)} placeholder="Your old SSR number" className={INPUT} />
            </Field>
            <Field label="Sample No" hint="Assigned when sample received">
              <input value={sampleNo} onChange={(e) => setSampleNo(e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Design Number">
            <input value={designNumber} onChange={(e) => setDesignNumber(e.target.value)} className={INPUT} />
          </Field>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Materials</h2>
          <SearchableSelect label="Party" table="parties" value={partyId} onChange={setPartyId} options={parties} setOptions={setParties} />
          <SearchableSelect label="Fabric" table="fabrics" value={fabricId} onChange={setFabricId} options={fabrics} setOptions={setFabrics} />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect label="Front Yarn" table="yarns" value={yarnFrontId} onChange={setYarnFrontId} options={yarns} setOptions={setYarns} />
            <SearchableSelect label="Back Yarn" table="yarns" value={yarnBackId} onChange={setYarnBackId} options={yarns} setOptions={setYarns} />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Production</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sample Type">
              <select value={sampleType} onChange={(e) => setSampleType(e.target.value)} className={INPUT}>
                <option value="">Select type</option>
                <option>Schiffli</option>
                <option>Aari</option>
                <option>Multy</option>
              </select>
            </Field>
            <Field label="Machine">
              <input value={machine} onChange={(e) => setMachine(e.target.value)} className={INPUT} />
            </Field>
          </div>
          <Field label="Operator">
            <input value={operator} onChange={(e) => setOperator(e.target.value)} className={INPUT} />
          </Field>
          <Field label="Remarks">
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={INPUT + " resize-none"} />
          </Field>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="dyeing" checked={dyeingRequired} onChange={(e) => setDyeingRequired(e.target.checked)} className="w-4 h-4 rounded accent-amber-600" />
            <label htmlFor="dyeing" className="text-sm font-semibold">Dyeing required</label>
          </div>
          {dyeingRequired && (
            <Field label="Dyeing Unit">
              <input value={dyeingName} onChange={(e) => setDyeingName(e.target.value)} placeholder="e.g. Bhairav" className={INPUT} />
            </Field>
          )}
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
