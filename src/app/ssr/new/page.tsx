"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SearchableSelect, SelectOption } from "@/components/SearchableSelect";
import { ChevronLeft, Loader2, Search, Check, X } from "lucide-react";

// ── DSSR searchable select ────────────────────────────────────────────────────
function DssrSelect({ value, onChange, dssrs }: {
  value: string | null;
  onChange: (id: string | null, designNo?: string) => void;
  dssrs: { id: string; dssr_number: string; design_number: string | null; party_name?: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = dssrs.find((d) => d.id === value);
  const filtered = dssrs.filter((d) =>
    [d.dssr_number, d.design_number, d.party_name].some(
      (v) => v?.toLowerCase().includes(query.toLowerCase())
    )
  );

  return (
    <div className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
        Linked Design (DSSR) <span className="font-normal normal-case text-stone-400">— optional</span>
      </label>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-600"
      >
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected
            ? `${selected.dssr_number}${selected.design_number ? ` — ${selected.design_number}` : ""}`
            : "Not linked — select if design exists"}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="text-stone-400 hover:text-red-500 p-0.5">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Search className="w-3.5 h-3.5 text-stone-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input autoFocus type="text" value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search DSSR number or design number..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <button type="button"
              onClick={() => { onChange(null); setOpen(false); setQuery(""); }}
              className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-50 flex items-center justify-between"
            >
              No link
              {!value && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
            {filtered.map((d) => (
              <button key={d.id} type="button"
                onClick={() => { onChange(d.id, d.design_number || ""); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between"
              >
                <span>
                  <span className="font-medium">{d.dssr_number}</span>
                  {d.design_number && <span className="text-stone-500 ml-2">{d.design_number}</span>}
                  {d.party_name && <span className="text-stone-400 ml-2">· {d.party_name}</span>}
                </span>
                {d.id === value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            ))}
            {filtered.length === 0 && query && (
              <p className="px-3 py-2 text-sm text-stone-400">No results for &ldquo;{query}&rdquo;</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
const SELECT = "w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";

// ── Main form ─────────────────────────────────────────────────────────────────
function NewSsrForm() {
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextNo, setNextNo] = useState("");
  const [userId, setUserId] = useState("");

  const [parties, setParties] = useState<SelectOption[]>([]);
  const [fabrics, setFabrics] = useState<SelectOption[]>([]);
  const [yarns, setYarns] = useState<SelectOption[]>([]);
  const [dssrs, setDssrs] = useState<{ id: string; dssr_number: string; design_number: string | null; party_name?: string }[]>([]);

  // Form fields
  const [partyId, setPartyId] = useState<string | null>(null);
  const [fabricId, setFabricId] = useState<string | null>(null);
  const [yarnFrontId, setYarnFrontId] = useState<string | null>(null);
  const [yarnBackId, setYarnBackId] = useState<string | null>(null);
  const [dssrId, setDssrId] = useState<string | null>(null);
  const [designNumber, setDesignNumber] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [machine, setMachine] = useState("");
  const [operator, setOperator] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dyeingRequired, setDyeingRequired] = useState(false);
  const [machineType, setMachineType] = useState<string | null>(null);
  const [dyeingName, setDyeingName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [{ data: p }, { data: f }, { data: y }, { data: d }, { data: lastSsr }] = await Promise.all([
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("fabrics").select("id, name").order("name"),
        supabase.from("yarns").select("id, name").order("name"),
        supabase.from("dssr").select("id, dssr_number, design_number, party:parties(name)").order("dssr_number", { ascending: false }),
        supabase.from("ssr").select("ssr_number").order("created_at", { ascending: false }).limit(50),
      ]);

      setParties(p ?? []);
      setFabrics(f ?? []);
      setYarns(y ?? []);
      setDssrs((d ?? []).map((row: any) => ({
        id: row.id,
        dssr_number: row.dssr_number,
        design_number: row.design_number,
        party_name: row.party?.name,
      })));

      // Auto-generate next SSR number
      const nums = (lastSsr ?? []).map((r: any) => parseInt(r.ssr_number)).filter((n: number) => !isNaN(n));
      if (nums.length > 0) setNextNo(String(Math.max(...nums) + 1));

      // Pre-fill if linked from DSSR page
      const dssrParam = params.get("dssr");
      if (dssrParam && d) {
        const match = (d as any[]).find((row) => row.id === dssrParam);
        if (match) {
          setDssrId(match.id);
          setDesignNumber(match.design_number || "");
          if (match.machine_type) setMachineType(match.machine_type);
        }
      }

      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDssrChange(id: string | null, designNo?: string) {
    setDssrId(id);
    if (designNo) setDesignNumber(designNo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nextNo) { setError("Could not generate SSR number. Please refresh."); return; }
    setSaving(true);

    const { data, error: err } = await supabase.from("ssr").insert({
      ssr_number: nextNo,
      party_id: partyId,
      dssr_id: dssrId,
      design_number: designNumber || null,
      fabric_id: fabricId,
      yarn_front_id: yarnFrontId,
      yarn_back_id: yarnBackId,
      sample_type: sampleType || null,
      machine: machine || null,
      operator: operator || null,
      remarks: remarks || null,
      machine_type: machineType || null,
      dyeing_required: dyeingRequired,
      dyeing_name: dyeingName || null,
      status: "YTR",
      created_by: userId,
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }

    await supabase.from("activity_logs").insert({
      entity_type: "ssr", entity_id: data.id,
      action: "created", description: `SSR ${nextNo} created`,
      created_by: userId,
    });

    router.push(`/ssr/${data.id}`);
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
        <h1 className="text-2xl font-bold tracking-tight font-display">New Sample</h1>
        <p className="text-sm text-stone-500 mt-1">
          SSR Number will be auto-assigned:
          <span className="ml-1 font-semibold text-amber-700">#{nextNo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Design */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design</h2>
          <DssrSelect value={dssrId} onChange={handleDssrChange} dssrs={dssrs} />
          <Field label="Design Number" hint="Auto-filled when you select a DSSR above, or type manually">
            <input value={designNumber} onChange={(e) => setDesignNumber(e.target.value)}
              placeholder="e.g. KB-8-1007878" className={INPUT} />
          </Field>
        </div>

        {/* Materials */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Materials</h2>
          <SearchableSelect label="Party" table="parties"
            value={partyId} onChange={setPartyId}
            options={parties} setOptions={setParties} />
          <SearchableSelect label="Fabric" table="fabrics"
            value={fabricId} onChange={setFabricId}
            options={fabrics} setOptions={setFabrics} />
          <div className="grid grid-cols-2 gap-3">
            <SearchableSelect label="Front Yarn" table="yarns"
              value={yarnFrontId} onChange={setYarnFrontId}
              options={yarns} setOptions={setYarns} />
            <SearchableSelect label="Back Yarn" table="yarns"
              value={yarnBackId} onChange={setYarnBackId}
              options={yarns} setOptions={setYarns}
              placeholder="Same as front or different" />
          </div>
        </div>

        {/* Production */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Production</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sample Type">
              <select value={sampleType} onChange={(e) => setSampleType(e.target.value)} className={SELECT}>
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
            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2}
              className={INPUT + " resize-none"} />
          </Field>
        </div>

        {/* Dyeing */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="dyeing" checked={dyeingRequired}
              onChange={(e) => setDyeingRequired(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-600" />
            <label htmlFor="dyeing" className="text-sm font-semibold">Dyeing required</label>
          </div>
          {dyeingRequired && (
            <Field label="Dyeing Unit">
              <input value={dyeingName} onChange={(e) => setDyeingName(e.target.value)}
                placeholder="e.g. Bhairav, Jeen Mata" className={INPUT} />
            </Field>
          )}
        </div>

        {/* Sample No note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium">
            📋 <strong>Sample Number</strong> is assigned after the physical sample is received and numbered — add it from the sample detail page.
          </p>
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
          Create Sample — SSR #{nextNo}
        </button>
      </form>
    </div>
  );
}

export default function NewSsrPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-600" /></div>}>
      <NewSsrForm />
    </Suspense>
  );
}
