"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, Loader2, Hash } from "lucide-react";

export function SampleNumberPanel({ ssrId, currentSampleNo }: { ssrId: string; currentSampleNo: string | null }) {
  const supabase = createClient();
  const [sampleNo, setSampleNo] = useState(currentSampleNo || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(!currentSampleNo);

  async function save() {
    if (!sampleNo.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("ssr").update({ sample_no: sampleNo.trim() }).eq("id", ssrId);
    if (!error) {
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
        Sample Number Assignment
      </h2>

      {!editing && currentSampleNo ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-(--color-thread)" />
            <div>
              <p className="text-lg font-bold text-(--color-thread)">{currentSampleNo}</p>
              <p className="text-xs text-(--color-ink-soft)">Sample number assigned</p>
            </div>
          </div>
          <button onClick={() => setEditing(true)}
            className="text-xs text-(--color-thread) font-medium border border-(--color-line) px-3 py-1.5 rounded-lg">
            Change
          </button>
        </div>
      ) : (
        <div>
          <p className="text-sm text-(--color-ink-soft) mb-3">
            Assign the physical sample number once the sample is received and numbered.
          </p>
          <div className="flex gap-2">
            <input
              value={sampleNo}
              onChange={(e) => setSampleNo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="e.g. SMP-066"
              className="flex-1 rounded-xl border border-(--color-line) bg-(--color-paper) px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
            />
            <button onClick={save} disabled={saving || !sampleNo.trim()}
              className="bg-(--color-thread) text-white rounded-xl px-4 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : "Assign"}
            </button>
          </div>
          {currentSampleNo && (
            <button onClick={() => setEditing(false)} className="text-xs text-(--color-ink-soft) mt-2">
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Costing prompt */}
      {currentSampleNo && (
        <div className="mt-4 pt-4 border-t border-(--color-line)">
          <p className="text-xs text-(--color-ink-soft) mb-2">
            Sample #{currentSampleNo} received. Ready to fill in costing details?
          </p>
          <button
            onClick={() => {
              const tabBtn = document.querySelector("[data-tab=costing]") as HTMLButtonElement;
              if (tabBtn) tabBtn.click();
            }}
            className="text-sm font-semibold text-(--color-thread) flex items-center gap-1">
            → Go to 📊 Costing tab
          </button>
        </div>
      )}
    </div>
  );
}
