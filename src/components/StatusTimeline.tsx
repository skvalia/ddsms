"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Pencil, Trash2, Check, X } from "lucide-react";

type HistoryItem = {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  remarks: string | null;
};

export function StatusTimeline({ history, ssrId }: { history: HistoryItem[]; ssrId?: string }) {
  const supabase = createClient();
  const [items, setItems] = useState(history);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveNote(id: string) {
    setSaving(true);
    const { error } = await supabase
      .from("status_history")
      .update({ remarks: editNote || null })
      .eq("id", id);
    if (!error) {
      setItems(prev => prev.map(item =>
        item.id === id ? { ...item, remarks: editNote || null } : item
      ));
      setEditingId(null);
    }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    if (!confirm("Delete this status entry? This cannot be undone.")) return;
    const { error } = await supabase.from("status_history").delete().eq("id", id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-(--color-ink-soft)">No status changes yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id} className="flex gap-3">
          {/* Timeline dot */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-2.5 rounded-full bg-(--color-thread) mt-1 shrink-0" />
            {idx < items.length - 1 && (
              <div className="w-px flex-1 bg-(--color-line) mt-1" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {item.old_status ? (
                    <span className="text-(--color-ink-soft)">{item.old_status} → </span>
                  ) : null}
                  {item.new_status}
                </p>
                <p className="text-xs text-(--color-ink-soft) mt-0.5">
                  {format(new Date(item.changed_at), "dd MMM yyyy, HH:mm")}
                </p>
              </div>

              {/* Edit/Delete buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => { setEditingId(item.id); setEditNote(item.remarks || ""); }}
                  className="p-1 text-(--color-ink-soft) hover:text-(--color-thread) rounded"
                  title="Edit note"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteEntry(item.id)}
                  className="p-1 text-(--color-ink-soft) hover:text-red-500 rounded"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Note display or edit */}
            {editingId === item.id ? (
              <div className="mt-2 flex items-center gap-2">
                <input
                  autoFocus
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveNote(item.id)}
                  placeholder="Add a note..."
                  className="flex-1 rounded-lg border border-(--color-line) bg-(--color-paper) px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
                />
                <button
                  onClick={() => saveNote(item.id)}
                  disabled={saving}
                  className="text-(--color-thread) p-1"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-(--color-ink-soft) p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : item.remarks ? (
              <p className="text-xs text-(--color-ink-soft) mt-1 italic bg-(--color-paper) rounded-lg px-2.5 py-1.5">
                {item.remarks}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
