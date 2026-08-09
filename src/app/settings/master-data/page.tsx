"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Table = "parties" | "yarns" | "fabrics" | "design_types" | "sketch_artists" | "designers";
type Row = { id: string; name: string };

const TABS: { key: Table; label: string; desc: string }[] = [
  { key: "parties", label: "Parties", desc: "Customers and buyers" },
  { key: "yarns", label: "Yarns", desc: "Front and back yarn types" },
  { key: "fabrics", label: "Fabrics", desc: "Fabric types" },
  { key: "design_types", label: "Design Types", desc: "Allover, Border, Placement etc." },
  { key: "sketch_artists", label: "Sketch Artists", desc: "Who sketches designs" },
  { key: "designers", label: "Designers", desc: "CAD/digitising team" },
];

export default function MasterDataPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<Table>("parties");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { load(tab); }, [tab]);

  async function load(t: Table) {
    setLoading(true); setError(null);
    const { data } = await supabase.from(t).select("id, name").order("name");
    setRows(data ?? []); setLoading(false);
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    setAdding(true); setError(null);
    const { data, error: err } = await supabase.from(tab).insert({ name }).select().single();
    if (err) setError(err.message);
    else { setRows((r) => [...r, data as Row].sort((a, b) => a.name.localeCompare(b.name))); setNewName(""); }
    setAdding(false);
  }

  async function saveEdit(id: string) {
    const name = editVal.trim();
    if (!name) return;
    const { error: err } = await supabase.from(tab).update({ name }).eq("id", id);
    if (err) setError(err.message);
    else { setRows((r) => r.map((row) => row.id === id ? { ...row, name } : row).sort((a, b) => a.name.localeCompare(b.name))); setEditId(null); }
  }

  async function del(id: string) {
    const { error: err } = await supabase.from(tab).delete().eq("id", id);
    if (err) setError("Cannot delete — item is used by existing records. Rename instead.");
    else setRows((r) => r.filter((row) => row.id !== id));
  }

  const currentTab = TABS.find(t => t.key === tab)!;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-4 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Manage Data</h1>
      <p className="text-sm text-stone-500 mb-5">Add, rename, or remove master data used across the system.</p>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(null); }}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
              tab === t.key
                ? "bg-amber-700 text-white border-amber-700"
                : "bg-white text-stone-500 border-stone-200"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-stone-400 mb-3">{currentTab.desc}</p>

      {/* Add new */}
      <div className="flex gap-2 mb-4">
        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={`Add new ${currentTab.label.toLowerCase().slice(0, -1)}...`}
          className="flex-1 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
        <button onClick={add} disabled={adding || !newName.trim()}
          className="rounded-xl bg-amber-700 text-white px-4 flex items-center gap-1.5 text-sm font-semibold disabled:opacity-50">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-stone-400" /></div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2 px-4 py-2.5">
              {editId === row.id ? (
                <>
                  <input value={editVal} onChange={(e) => setEditVal(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(row.id)} autoFocus
                    className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
                  <button onClick={() => saveEdit(row.id)} className="text-amber-600 p-1"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditId(null)} className="text-stone-400 p-1"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{row.name}</span>
                  <button onClick={() => { setEditId(row.id); setEditVal(row.name); }} className="text-stone-400 hover:text-amber-600 p-1"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(row.id)} className="text-stone-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-4 py-8 text-sm text-stone-400 text-center">No {currentTab.label.toLowerCase()} yet — add one above.</p>
          )}
        </div>
      )}
    </div>
  );
}
