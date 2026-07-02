"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Plus, Search, X, Check, ChevronLeft } from "lucide-react";

// ─── Inline searchable select with add-new ───────────────────────────────────
type Option = { id: string; name: string };

function InlineSelect({
  label,
  table,
  value,
  onChange,
  options,
  setOptions,
  placeholder = "Search or add new...",
  required = false,
}: {
  label: string;
  table: "parties" | "yarns" | "fabrics";
  value: string | null;
  onChange: (id: string | null, name: string | null) => void;
  options: Option[];
  setOptions: (o: Option[]) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const selected = options.find((o) => o.id === value);
  const filtered = options
    .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));
  const exactMatch = options.some(
    (o) => o.name.toLowerCase() === query.trim().toLowerCase()
  );

  async function addNew() {
    const name = query.trim();
    if (!name || adding) return;
    setAdding(true);
    const { data, error } = await supabase.from(table).insert({ name }).select().single();
    if (!error && data) {
      const newOpt = { id: data.id, name: data.name };
      setOptions([...options, newOpt]);
      onChange(newOpt.id, newOpt.name);
      setOpen(false);
      setQuery("");
    }
    setAdding(false);
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
      >
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected ? selected.name : `Select ${label.toLowerCase()}...`}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange(null, null); }} className="text-stone-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Search className="w-3.5 h-3.5 text-stone-400" />
        </div>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !exactMatch && query.trim() && addNew()}
              placeholder={placeholder}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.map((opt) => (
              <button key={opt.id} type="button"
                onClick={() => { onChange(opt.id, opt.name); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between"
              >
                {opt.name}
                {opt.id === value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            ))}
            {filtered.length === 0 && !query && (
              <p className="px-3 py-2 text-sm text-stone-400">Nothing here yet — type to add.</p>
            )}
          </div>
          {query.trim() && !exactMatch && (
            <button type="button" onClick={addNew} disabled={adding}
              className="border-t border-stone-100 px-3 py-2 text-sm text-amber-700 font-semibold flex items-center gap-2 hover:bg-amber-50 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add &ldquo;{query.trim()}&rdquo; as new {label.toLowerCase()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DSSR searchable select ──────────────────────────────────────────────────
function DssrSelect({
  value,
  onChange,
  dssrs,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  dssrs: { id: string; dssr_number: string; design_number: string | null; party?: { name: string } | null }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = dssrs.find((d) => d.id === value);
  const filtered = dssrs.filter(
    (d) =>
      d.dssr_number?.toLowerCase().includes(query.toLowerCase()) ||
      d.design_number?.toLowerCase().includes(query.toLowerCase()) ||
      d.party?.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
        Linked Design (DSSR) <span className="font-normal normal-case text-stone-400">— optional</span>
      </label>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-amber-600"
      >
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected
            ? `${selected.dssr_number}${selected.design_number ? ` — ${selected.design_number}` : ""}`
            : "Not linked to a design (optional)"}
        </span>
        <div className="flex items-center gap-1">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-stone-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <Search className="w-3.5 h-3.5 text-stone-400" />
        </div>
      </button>
      {open && (
        <div className="absolute z-40 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search DSSR number or design number..."
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            <button type="button" onClick={() => { onChange(null); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm text-stone-400 hover:bg-stone-50 flex items-center justify-between"
            >
              No link
              {!value && <Check className="w-3.5 h-3.5 text-amber-600" />}
            </button>
            {filtered.map((d) => (
              <button key={d.id} type="button"
                onClick={() => { onChange(d.id); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between"
              >
                <span>
                  <span className="font-medium">{d.dssr_number}</span>
                  {d.design_number && <span className="text-stone-500 ml-2">{d.design_number}</span>}
                  {d.party?.name && <span className="text-stone-400 ml-2">· {d.party.name}</span>}
                </span>
                {d.id === value && <Check className="w-3.5 h-3.5 text-amber-600" />}
              </button>
            ))}
            {filtered.length === 0 && query && (
              <p className="px-3 py-2 text-sm text-stone-400">No DSSR matches &ldquo;{query}&rdquo;</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main form ───────────────────────────────────────────────────────────────
function NewSsrForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextSsrNo, setNextSsrNo] = useState<string>("");

  // Master data
  const [parties, setParties] = useState<Option[]>([]);
  const [fabrics, setFabrics] = useState<Option[]>([]);
  const [yarns, setYarns] = useState<Option[]>([]);
  const [dssrs, setDssrs] = useState<any[]>([]);
  const [userId, setUserId] = useState("");

  // Form state
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
  const [dyeingName, setDyeingName] = useState("");

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? "");

      const [
        { data: p },
        { data: f },
        { data: y },
        { data: d },
        { data: lastSsr },
      ] = await Promise.all([
        supabase.from("parties").select("id, name").order("name"),
        supabase.from("fabrics").select("id, name").order("name"),
        supabase.from("yarns").select("id, name").order("name"),
        supabase.from("dssr").select("id, dssr_number, design_number, party:parties(name)").order("dssr_number", { ascending: false }),
        // Get the highest SSR number to auto-increment
        supabase.from("ssr").select("ssr_number").order("created_at", { ascending: false }).limit(50),
      ]);

      setParties(p ?? []);
      setFabrics(f ?? []);
      setYarns(y ?? []);
      setDssrs(d ?? []);

      // Auto-generate next SSR number
      if (lastSsr && lastSsr.length > 0) {
        const nums = lastSsr
          .map((r: any) => parseInt(r.ssr_number))
          .filter((n: number) => !isNaN(n));
        if (nums.length > 0) {
          setNextSsrNo(String(Math.max(...nums) + 1));
        }
      }

      // Pre-fill from DSSR if linked via URL param
      const dssrParam = searchParams.get("dssr");
      if (dssrParam && d) {
        const match = d.find((row: any) => row.id === dssrParam);
        if (match) {
          setDssrId(match.id);
          setDesignNumber(match.design_number || "");
        }
      }

      setLoading(false);
    })();
  }, [supabase, searchParams]);

  // When DSSR is selected, auto-fill design number
  function handleDssrChange(id: string | null) {
    setDssrId(id);
    if (id) {
      const match = dssrs.find((d) => d.id === id);
      if (match?.design_number) setDesignNumber(match.design_number);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!nextSsrNo.trim()) {
      setError("SSR number could not be generated. Please refresh and try again.");
      return;
    }

    setSaving(true);

    const { data, error: insertError } = await supabase
      .from("ssr")
      .insert({
        ssr_number: nextSsrNo,
        party_id: partyId || null,
        dssr_id: dssrId || null,
        design_number: designNumber || null,
        fabric_id: fabricId || null,
        yarn_front_id: yarnFrontId || null,
        yarn_back_id: yarnBackId || null,
        sample_type: sampleType || null,
        machine: machine || null,
        operator: operator || null,
        remarks: remarks || null,
        dyeing_required: dyeingRequired,
        dyeing_name: dyeingName || null,
        status: "YTR",
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      entity_type: "ssr",
      entity_id: data.id,
      action: "created",
      description: `SSR ${nextSsrNo} created`,
      created_by: userId,
    });

    router.push(`/ssr/${data.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-5 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          New Sample
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          SSR Number will be auto-assigned:{" "}
          <span className="font-semibold text-amber-700">#{nextSsrNo}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Design number + DSSR link */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Design</h2>

          <DssrSelect value={dssrId} onChange={handleDssrChange} dssrs={dssrs} />

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
              Design Number
            </label>
            <input
              type="text"
              value={designNumber}
              onChange={(e) => setDesignNumber(e.target.value)}
              placeholder="e.g. KB-8-1007878"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
            <p className="text-xs text-stone-400 mt-1">
              Auto-filled when you select a DSSR above, or type manually.
            </p>
          </div>
        </div>

        {/* Party + fabric + yarn */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Materials</h2>

          <InlineSelect
            label="Party"
            table="parties"
            value={partyId}
            onChange={(id) => setPartyId(id)}
            options={parties}
            setOptions={setParties}
          />

          <InlineSelect
            label="Fabric"
            table="fabrics"
            value={fabricId}
            onChange={(id) => setFabricId(id)}
            options={fabrics}
            setOptions={setFabrics}
          />

          <div className="grid grid-cols-2 gap-3">
            <InlineSelect
              label="Front Yarn"
              table="yarns"
              value={yarnFrontId}
              onChange={(id) => setYarnFrontId(id)}
              options={yarns}
              setOptions={setYarns}
            />
            <InlineSelect
              label="Back Yarn"
              table="yarns"
              value={yarnBackId}
              onChange={(id) => setYarnBackId(id)}
              options={yarns}
              setOptions={setYarns}
              placeholder="Same as front, or different"
            />
          </div>
        </div>

        {/* Production details */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400">Production</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">Sample Type</label>
              <select
                value={sampleType}
                onChange={(e) => setSampleType(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              >
                <option value="">Select type</option>
                <option value="Schiffli">Schiffli</option>
                <option value="Aari">Aari</option>
                <option value="Multy">Multy</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">Machine</label>
              <input
                type="text"
                value={machine}
                onChange={(e) => setMachine(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">Operator</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 resize-none"
            />
          </div>
        </div>

        {/* Dyeing */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dyeing_req"
              checked={dyeingRequired}
              onChange={(e) => setDyeingRequired(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-600"
            />
            <label htmlFor="dyeing_req" className="text-sm font-semibold">Dyeing required for this sample</label>
          </div>
          {dyeingRequired && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">Dyeing Unit</label>
              <input
                type="text"
                value={dyeingName}
                onChange={(e) => setDyeingName(e.target.value)}
                placeholder="e.g. Chur Textile"
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          )}
        </div>

        {/* Sample No note */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-700 font-medium">
            📋 <strong>Sample Number</strong> is assigned later — once the physical sample is received and numbered. You can add it from the sample detail page.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-amber-700 text-white rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] transition-transform"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Sample — SSR #{nextSsrNo}
        </button>

      </form>
    </div>
  );
}

export default function NewSsrPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
      </div>
    }>
      <NewSsrForm />
    </Suspense>
  );
}
