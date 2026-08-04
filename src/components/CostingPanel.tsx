"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";

const INPUT = "w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600";
const SELECT = INPUT;

function Field({ label, unit, children }: { label: string; unit?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-stone-500 mb-1">
        {label}{unit && <span className="text-stone-400 ml-1">({unit})</span>}
      </label>
      {children}
    </div>
  );
}

function Section({ title, open, toggle, children }: {
  title: string; open: boolean; toggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden">
      <button type="button" onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 text-sm font-semibold text-stone-700 hover:bg-stone-100"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      {open && <div className="px-4 py-4 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

type CostingData = {
  // Machine
  machine_type: string; machine_repeat: string; revolutions: string;
  design_height_mm: string; needle_count: string;
  machine_in_datetime: string; machine_out_datetime: string; pieces_per_shift: string;
  // Yarn
  yarn_front_length_m: string; yarn_back_length_m: string;
  yarn_actual_weight_g: string; stitch_rate: string; mending_cost_per_mtr: string;
  // Fabric
  fabric_width_inches: string; fabric_rate_per_mtr: string;
  fabric_cut_length_mtr: string; fabric_value_loss_pct: string;
  // Dyeing
  dyeing_mill: string; dyeing_shade: string;
  dyeing_cost_per_mtr: string; dyeing_mtr_realisation: string;
  // Packing
  packing_inner: boolean; packing_outer: boolean; scallop_sides: string;
  packing_type: string; has_stone: boolean; thread_cutting_extra: boolean;
  spotting_cost: boolean; corrugated_box: boolean; pieces_per_bardan: string;
  // Margin
  margin_profit_pct: string; margin_brokerage_pct: string;
  margin_cash_discount_pct: string; margin_interest_pct: string;
  margin_incentive_pct: string; margin_marketing_pct: string;
  // Notes
  costing_notes: string; costing_locked: boolean;
};

export function CostingPanel({ ssrId, initial }: { ssrId: string; initial: Partial<CostingData> }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section open/close state
  const [openMachine, setOpenMachine] = useState(true);
  const [openYarn, setOpenYarn] = useState(false);
  const [openFabric, setOpenFabric] = useState(false);
  const [openDyeing, setOpenDyeing] = useState(false);
  const [openPacking, setOpenPacking] = useState(false);
  const [openMargin, setOpenMargin] = useState(false);

  const [d, setD] = useState<CostingData>({
    machine_type: initial.machine_type || "",
    machine_repeat: initial.machine_repeat || "",
    revolutions: initial.revolutions?.toString() || "",
    design_height_mm: initial.design_height_mm?.toString() || "",
    needle_count: initial.needle_count?.toString() || "",
    machine_in_datetime: initial.machine_in_datetime?.toString().slice(0, 16) || "",
    machine_out_datetime: initial.machine_out_datetime?.toString().slice(0, 16) || "",
    pieces_per_shift: initial.pieces_per_shift?.toString() || "",
    yarn_front_length_m: initial.yarn_front_length_m?.toString() || "",
    yarn_back_length_m: initial.yarn_back_length_m?.toString() || "",
    yarn_actual_weight_g: initial.yarn_actual_weight_g?.toString() || "",
    stitch_rate: initial.stitch_rate?.toString() || "",
    mending_cost_per_mtr: initial.mending_cost_per_mtr?.toString() || "",
    fabric_width_inches: initial.fabric_width_inches?.toString() || "",
    fabric_rate_per_mtr: initial.fabric_rate_per_mtr?.toString() || "",
    fabric_cut_length_mtr: initial.fabric_cut_length_mtr?.toString() || "",
    fabric_value_loss_pct: initial.fabric_value_loss_pct?.toString() || "4",
    dyeing_mill: initial.dyeing_mill || "",
    dyeing_shade: initial.dyeing_shade || "",
    dyeing_cost_per_mtr: initial.dyeing_cost_per_mtr?.toString() || "",
    dyeing_mtr_realisation: initial.dyeing_mtr_realisation?.toString() || "",
    packing_inner: initial.packing_inner || false,
    packing_outer: initial.packing_outer || false,
    scallop_sides: initial.scallop_sides?.toString() || "0",
    packing_type: initial.packing_type || "",
    has_stone: initial.has_stone || false,
    thread_cutting_extra: initial.thread_cutting_extra || false,
    spotting_cost: initial.spotting_cost || false,
    corrugated_box: initial.corrugated_box || false,
    pieces_per_bardan: initial.pieces_per_bardan?.toString() || "9",
    margin_profit_pct: initial.margin_profit_pct?.toString() || "15",
    margin_brokerage_pct: initial.margin_brokerage_pct?.toString() || "2",
    margin_cash_discount_pct: initial.margin_cash_discount_pct?.toString() || "3",
    margin_interest_pct: initial.margin_interest_pct?.toString() || "0",
    margin_incentive_pct: initial.margin_incentive_pct?.toString() || "0",
    margin_marketing_pct: initial.margin_marketing_pct?.toString() || "0",
    costing_notes: initial.costing_notes || "",
    costing_locked: initial.costing_locked || false,
  });

  function upd(key: keyof CostingData, val: string | boolean) {
    setD((prev) => ({ ...prev, [key]: val }));
    setSaved(false);
  }

  const n = (v: string) => v === "" ? null : parseFloat(v);
  const i = (v: string) => v === "" ? null : parseInt(v);

  async function save() {
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("ssr").update({
      machine_type: d.machine_type || null,
      machine_repeat: d.machine_repeat || null,
      revolutions: i(d.revolutions),
      design_height_mm: n(d.design_height_mm),
      needle_count: i(d.needle_count),
      machine_in_datetime: d.machine_in_datetime || null,
      machine_out_datetime: d.machine_out_datetime || null,
      pieces_per_shift: i(d.pieces_per_shift),
      yarn_front_length_m: n(d.yarn_front_length_m),
      yarn_back_length_m: n(d.yarn_back_length_m),
      yarn_actual_weight_g: n(d.yarn_actual_weight_g),
      stitch_rate: n(d.stitch_rate),
      mending_cost_per_mtr: n(d.mending_cost_per_mtr),
      fabric_width_inches: n(d.fabric_width_inches),
      fabric_rate_per_mtr: n(d.fabric_rate_per_mtr),
      fabric_cut_length_mtr: n(d.fabric_cut_length_mtr),
      fabric_value_loss_pct: n(d.fabric_value_loss_pct),
      dyeing_mill: d.dyeing_mill || null,
      dyeing_shade: d.dyeing_shade || null,
      dyeing_cost_per_mtr: n(d.dyeing_cost_per_mtr),
      dyeing_mtr_realisation: n(d.dyeing_mtr_realisation),
      packing_inner: d.packing_inner,
      packing_outer: d.packing_outer,
      scallop_sides: i(d.scallop_sides),
      packing_type: d.packing_type || null,
      has_stone: d.has_stone,
      thread_cutting_extra: d.thread_cutting_extra,
      spotting_cost: d.spotting_cost,
      corrugated_box: d.corrugated_box,
      pieces_per_bardan: i(d.pieces_per_bardan),
      margin_profit_pct: n(d.margin_profit_pct),
      margin_brokerage_pct: n(d.margin_brokerage_pct),
      margin_cash_discount_pct: n(d.margin_cash_discount_pct),
      margin_interest_pct: n(d.margin_interest_pct),
      margin_incentive_pct: n(d.margin_incentive_pct),
      margin_marketing_pct: n(d.margin_marketing_pct),
      costing_notes: d.costing_notes || null,
      costing_locked: d.costing_locked,
    }).eq("id", ssrId);
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  if (d.costing_locked) return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
          <Lock className="w-4 h-4" /> Costing finalised
        </p>
        <button onClick={() => upd("costing_locked", false)}
          className="text-xs text-stone-500 underline flex items-center gap-1">
          <Unlock className="w-3 h-3" /> Unlock to edit
        </button>
      </div>
      <p className="text-xs text-stone-500">Costing is locked. Unlock to make changes.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-stone-500">
        Fill in production details for cost calculation. All fields are optional — save partial data at any time.
        Full costing calculation will be available in Phase 3.
      </p>

      {/* Machine & Time */}
      <Section title="⚙️ Machine & Production" open={openMachine} toggle={() => setOpenMachine((v) => !v)}>
        <Field label="Machine Type">
          <select value={d.machine_type} onChange={(e) => upd("machine_type", e.target.value)} className={SELECT}>
            <option value="">Select machine</option>
            <option>Saurer Epoca (Schiffli)</option>
            <option>Multi Machine</option>
            <option>Aari Machine (250 Area)</option>
            <option>Other</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Machine Repeat / Area">
            <select value={d.machine_repeat} onChange={(e) => upd("machine_repeat", e.target.value)} className={SELECT}>
              <option value="">Select repeat</option>
              {["4x4 (KB-4)", "8x4 (KB-8)", "12x4 (KB-12)", "16x4 (KB-16)", "20x4 (KB-20)",
                "24x4 (KB-24)", "200 heads", "400 heads", "600 heads"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Revolutions (Stitch Count)">
            <input type="number" value={d.revolutions} onChange={(e) => upd("revolutions", e.target.value)}
              placeholder="e.g. 31652" className={INPUT} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Design Height" unit="mm">
            <input type="number" value={d.design_height_mm} onChange={(e) => upd("design_height_mm", e.target.value)}
              placeholder="e.g. 1034" className={INPUT} />
          </Field>
          <Field label="No. of Needles">
            <input type="number" value={d.needle_count} onChange={(e) => upd("needle_count", e.target.value)}
              placeholder="e.g. 27" className={INPUT} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Machine In">
            <input type="datetime-local" value={d.machine_in_datetime}
              onChange={(e) => upd("machine_in_datetime", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Machine Out">
            <input type="datetime-local" value={d.machine_out_datetime}
              onChange={(e) => upd("machine_out_datetime", e.target.value)} className={INPUT} />
          </Field>
        </div>
        <Field label="Pieces per Shift">
          <input type="number" value={d.pieces_per_shift} onChange={(e) => upd("pieces_per_shift", e.target.value)}
            placeholder="e.g. 12" className={INPUT} />
        </Field>
      </Section>

      {/* Yarn */}
      <Section title="🧵 Yarn (from EM Studio)" open={openYarn} toggle={() => setOpenYarn((v) => !v)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Front Yarn Length" unit="metres">
            <input type="number" step="0.01" value={d.yarn_front_length_m}
              onChange={(e) => upd("yarn_front_length_m", e.target.value)}
              placeholder="e.g. 181.75" className={INPUT} />
          </Field>
          <Field label="Back Yarn Length" unit="metres">
            <input type="number" step="0.01" value={d.yarn_back_length_m}
              onChange={(e) => upd("yarn_back_length_m", e.target.value)}
              placeholder="e.g. 64.18" className={INPUT} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Actual Yarn Weight" unit="grams">
            <input type="number" step="0.01" value={d.yarn_actual_weight_g}
              onChange={(e) => upd("yarn_actual_weight_g", e.target.value)}
              placeholder="If different from theoretical" className={INPUT} />
          </Field>
          <Field label="Stitch Rate Override" unit="₹/stitch">
            <input type="number" step="0.0001" value={d.stitch_rate}
              onChange={(e) => upd("stitch_rate", e.target.value)}
              placeholder="e.g. 0.0115" className={INPUT} />
          </Field>
        </div>
        <Field label="Mending Cost" unit="₹/metre">
          <input type="number" step="0.01" value={d.mending_cost_per_mtr}
            onChange={(e) => upd("mending_cost_per_mtr", e.target.value)}
            placeholder="e.g. 5" className={INPUT} />
        </Field>
      </Section>

      {/* Fabric */}
      <Section title="🧶 Fabric Details" open={openFabric} toggle={() => setOpenFabric((v) => !v)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fabric Width" unit="inches">
            <input type="number" step="0.5" value={d.fabric_width_inches}
              onChange={(e) => upd("fabric_width_inches", e.target.value)}
              placeholder="e.g. 44" className={INPUT} />
          </Field>
          <Field label="Fabric Rate" unit="₹/metre">
            <input type="number" step="0.01" value={d.fabric_rate_per_mtr}
              onChange={(e) => upd("fabric_rate_per_mtr", e.target.value)}
              placeholder="e.g. 64" className={INPUT} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fabric Cut Length" unit="metres">
            <input type="number" step="0.01" value={d.fabric_cut_length_mtr}
              onChange={(e) => upd("fabric_cut_length_mtr", e.target.value)}
              placeholder="e.g. 21.25" className={INPUT} />
          </Field>
          <Field label="Value Loss %" unit="default 4%">
            <input type="number" step="0.1" value={d.fabric_value_loss_pct}
              onChange={(e) => upd("fabric_value_loss_pct", e.target.value)}
              placeholder="4" className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Dyeing */}
      <Section title="🎨 Dyeing" open={openDyeing} toggle={() => setOpenDyeing((v) => !v)}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dyeing Mill">
            <input value={d.dyeing_mill} onChange={(e) => upd("dyeing_mill", e.target.value)}
              placeholder="e.g. Bhairav, Jeen Mata, Chur" className={INPUT} />
          </Field>
          <Field label="Dyeing Shade">
            <select value={d.dyeing_shade} onChange={(e) => upd("dyeing_shade", e.target.value)} className={SELECT}>
              <option value="">Select shade</option>
              <option>White</option>
              <option>Light</option>
              <option>Medium</option>
              <option>Dark</option>
              <option>Extra Dark</option>
              <option>Finishing</option>
              <option>Refinishing</option>
              <option>Digital Print</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dyeing Cost Override" unit="₹/metre">
            <input type="number" step="0.01" value={d.dyeing_cost_per_mtr}
              onChange={(e) => upd("dyeing_cost_per_mtr", e.target.value)}
              placeholder="Overrides rate card" className={INPUT} />
          </Field>
          <Field label="Metre Realisation" unit="metres per lot">
            <input type="number" step="0.01" value={d.dyeing_mtr_realisation}
              onChange={(e) => upd("dyeing_mtr_realisation", e.target.value)}
              placeholder="e.g. 26" className={INPUT} />
          </Field>
        </div>
      </Section>

      {/* Packing */}
      <Section title="📦 Packing" open={openPacking} toggle={() => setOpenPacking((v) => !v)}>
        <div className="grid grid-cols-2 gap-3">
          {([
            ["packing_inner", "Inner Packing"],
            ["packing_outer", "Outer Packing"],
            ["has_stone", "Stone Work"],
            ["thread_cutting_extra", "Thread Cutting Extra"],
            ["spotting_cost", "Spotting Cost"],
            ["corrugated_box", "Corrugated Box"],
          ] as [keyof CostingData, string][]).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={d[key] as boolean}
                onChange={(e) => upd(key, e.target.checked)}
                className="w-4 h-4 rounded accent-amber-600" />
              {label}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <Field label="Scallop Sides">
            <select value={d.scallop_sides} onChange={(e) => upd("scallop_sides", e.target.value)} className={SELECT}>
              {["0","1","2","3","4","5","6"].map((v) => (
                <option key={v} value={v}>{v === "0" ? "None" : `${v} side${v !== "1" ? "s" : ""}`}</option>
              ))}
            </select>
          </Field>
          <Field label="Packing Type">
            <select value={d.packing_type} onChange={(e) => upd("packing_type", e.target.value)} className={SELECT}>
              <option value="">Select</option>
              <option>Book Fold (Without Putta)</option>
              <option>Book Fold (With Putta)</option>
              <option>Roll Packing</option>
            </select>
          </Field>
        </div>
        <Field label="Pieces per Bardan" unit="default 9">
          <input type="number" value={d.pieces_per_bardan}
            onChange={(e) => upd("pieces_per_bardan", e.target.value)}
            placeholder="9" className={INPUT} />
        </Field>
      </Section>

      {/* Margin */}
      <Section title="📊 Sales & Margin" open={openMargin} toggle={() => setOpenMargin((v) => !v)}>
        <div className="grid grid-cols-3 gap-3">
          {([
            ["margin_profit_pct", "Profit %", "15"],
            ["margin_brokerage_pct", "Brokerage %", "2"],
            ["margin_cash_discount_pct", "Cash Discount %", "3"],
            ["margin_interest_pct", "Interest % (pm)", "0"],
            ["margin_incentive_pct", "Incentive %", "0"],
            ["margin_marketing_pct", "Marketing %", "0"],
          ] as [keyof CostingData, string, string][]).map(([key, label, ph]) => (
            <Field key={key} label={label}>
              <input type="number" step="0.1" value={d[key] as string}
                onChange={(e) => upd(key, e.target.value)}
                placeholder={ph} className={INPUT} />
            </Field>
          ))}
        </div>
      </Section>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-stone-500 mb-1">Costing Notes</label>
        <textarea value={d.costing_notes} onChange={(e) => upd("costing_notes", e.target.value)}
          rows={2} placeholder="Any notes or assumptions..."
          className={INPUT + " resize-none"} />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex-1 bg-amber-700 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Saving..." : saved ? "✓ Saved" : "Save Costing Data"}
        </button>
        <button onClick={() => { upd("costing_locked", true); save(); }}
          title="Lock costing as finalised"
          className="p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:border-green-500 hover:text-green-600"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
