"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Check, Pencil } from "lucide-react";
import type { Ssr } from "@/types/database";

type TrackingFields = {
  dyeing_required: boolean;
  dyeing_name: string;
  dyeing_challan_no: string;
  dyeing_sent_date: string;
  dyeing_receive_date: string;
  outsource_unit_name: string;
  outsource_challan_no: string;
  outsource_sent_date: string;
  outsource_receive_date: string;
};

function toInputDate(value: string | null): string {
  return value ? value.slice(0, 10) : "";
}

export function TrackingPanel({ ssr, autoEdit }: { ssr: Ssr; autoEdit?: boolean }) {
  const supabase = createClient();
  const [editing, setEditing] = useState(!!autoEdit);
  const [saving, setSaving] = useState(false);

  const [fields, setFields] = useState<TrackingFields>({
    dyeing_required: ssr.dyeing_required,
    dyeing_name: ssr.dyeing_name || "",
    dyeing_challan_no: ssr.dyeing_challan_no || "",
    dyeing_sent_date: toInputDate(ssr.dyeing_sent_date),
    dyeing_receive_date: toInputDate(ssr.dyeing_receive_date),
    outsource_unit_name: ssr.outsource_unit_name || "",
    outsource_challan_no: ssr.outsource_challan_no || "",
    outsource_sent_date: toInputDate(ssr.outsource_sent_date),
    outsource_receive_date: toInputDate(ssr.outsource_receive_date),
  });

  function update<K extends keyof TrackingFields>(key: K, value: TrackingFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("ssr")
      .update({
        dyeing_required: fields.dyeing_required,
        dyeing_name: fields.dyeing_name || null,
        dyeing_challan_no: fields.dyeing_challan_no || null,
        dyeing_sent_date: fields.dyeing_sent_date || null,
        dyeing_receive_date: fields.dyeing_receive_date || null,
        outsource_unit_name: fields.outsource_unit_name || null,
        outsource_challan_no: fields.outsource_challan_no || null,
        outsource_sent_date: fields.outsource_sent_date || null,
        outsource_receive_date: fields.outsource_receive_date || null,
      })
      .eq("id", ssr.id);

    if (!error) {
      setEditing(false);
    }
    setSaving(false);
  }

  const hasAnyData =
    fields.dyeing_required ||
    fields.dyeing_challan_no ||
    fields.outsource_unit_name ||
    fields.outsource_challan_no;

  if (!editing && !hasAnyData) {
    return (
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft)">
            Dyeing &amp; Outsource Tracking
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-(--color-thread)"
          >
            <Pencil className="w-3.5 h-3.5" /> Add details
          </button>
        </div>
        <p className="text-sm text-(--color-ink-soft) mt-2">
          No dyeing or outside embroidery recorded for this sample.
        </p>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft)">
            Dyeing &amp; Outsource Tracking
          </h2>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs font-medium text-(--color-thread)"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          {fields.dyeing_required && (
            <>
              <ReadItem label="Dyeing Unit" value={fields.dyeing_name} />
              <ReadItem label="Dyeing Challan" value={fields.dyeing_challan_no} />
              <ReadItem label="Dyeing Sent" value={fields.dyeing_sent_date} date />
              <ReadItem label="Dyeing Received" value={fields.dyeing_receive_date} date />
            </>
          )}
          {(fields.outsource_unit_name || fields.outsource_challan_no) && (
            <>
              <ReadItem label="Outsource Unit" value={fields.outsource_unit_name} />
              <ReadItem label="Outsource Challan" value={fields.outsource_challan_no} />
              <ReadItem label="Sent to Outsource" value={fields.outsource_sent_date} date />
              <ReadItem label="Received from Outsource" value={fields.outsource_receive_date} date />
            </>
          )}
        </dl>
      </div>
    );
  }

  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
        Dyeing &amp; Outsource Tracking
      </h2>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="checkbox"
          id="edit_dyeing_required"
          checked={fields.dyeing_required}
          onChange={(e) => update("dyeing_required", e.target.checked)}
          className="w-4 h-4 rounded accent-(--color-thread)"
        />
        <label htmlFor="edit_dyeing_required" className="text-sm font-medium">
          Dyeing required
        </label>
      </div>

      {fields.dyeing_required && (
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-(--color-line)">
          <TrackField label="Dyeing Unit" value={fields.dyeing_name} onChange={(v) => update("dyeing_name", v)} placeholder="e.g. Chur Textile" />
          <TrackField label="Dyeing Challan No" value={fields.dyeing_challan_no} onChange={(v) => update("dyeing_challan_no", v)} placeholder="e.g. 04" />
          <TrackField label="Dyeing Sent Date" value={fields.dyeing_sent_date} onChange={(v) => update("dyeing_sent_date", v)} type="date" />
          <TrackField label="Dyeing Received Date" value={fields.dyeing_receive_date} onChange={(v) => update("dyeing_receive_date", v)} type="date" />
        </div>
      )}

      <p className="text-xs font-medium mb-2 text-(--color-ink-soft)">Outside Embroidery (if sent out)</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <TrackField label="Outsource Unit" value={fields.outsource_unit_name} onChange={(v) => update("outsource_unit_name", v)} placeholder="e.g. Silver Touch" />
        <TrackField label="Outsource Challan No" value={fields.outsource_challan_no} onChange={(v) => update("outsource_challan_no", v)} placeholder="e.g. 000131" />
        <TrackField label="Sent Date" value={fields.outsource_sent_date} onChange={(v) => update("outsource_sent_date", v)} type="date" />
        <TrackField label="Received Date" value={fields.outsource_receive_date} onChange={(v) => update("outsource_receive_date", v)} type="date" />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-(--color-thread) text-white rounded-lg py-2 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save
        </button>
        <button
          onClick={() => setEditing(false)}
          disabled={saving}
          className="px-4 rounded-lg border border-(--color-line) text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ReadItem({ label, value, date }: { label: string; value: string; date?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-(--color-ink-soft)">{label}</dt>
      <dd className="font-medium mt-0.5">
        {date ? format2(value) : value}
      </dd>
    </div>
  );
}

function format2(isoDate: string) {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function TrackField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-(--color-ink-soft)">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
      />
    </div>
  );
}
