"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Plus, X, Check, Loader2 } from "lucide-react";

export type SelectOption = { id: string; name: string; badge?: string };

type Props = {
  label: string;
  table: "parties" | "yarns" | "fabrics" | "design_types" | "sketch_artists" | "designers" | "machine_types";
  value: string | null;
  onChange: (id: string | null) => void;
  options: SelectOption[];
  setOptions: (opts: SelectOption[]) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
};

export function SearchableSelect({ label, table, value, onChange, options, setOptions, placeholder, required = false, hint }: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name));
  const exactMatch = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setQuery(""); }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function addNew() {
    const name = query.trim();
    if (!name || adding) return;
    setAdding(true);
    const { data, error } = await supabase.from(table).insert({ name }).select().single();
    if (!error && data) {
      const opt = { id: data.id, name: data.name };
      setOptions([...options, opt]);
      onChange(opt.id);
      setOpen(false); setQuery("");
    }
    setAdding(false);
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-600">
        <span className={selected ? "text-stone-800 font-medium" : "text-stone-400"}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.name}
              {selected.badge && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">{selected.badge} pending</span>}
            </span>
          ) : (placeholder || `Select ${label.toLowerCase()}...`)}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && <span onClick={(e) => { e.stopPropagation(); onChange(null); }} className="text-stone-400 hover:text-red-500 p-0.5"><X className="w-3.5 h-3.5" /></span>}
          <Search className="w-3.5 h-3.5 text-stone-400" />
        </div>
      </button>
      {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-stone-100">
            <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && query.trim() && !exactMatch) addNew(); }}
              placeholder={`Search or type to add new...`}
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600" />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && !query && <p className="px-3 py-3 text-sm text-stone-400 text-center">Type to add a new entry</p>}
            {filtered.map((opt) => (
              <button key={opt.id} type="button" onClick={() => { onChange(opt.id); setOpen(false); setQuery(""); }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {opt.name}
                  {opt.badge && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">{opt.badge} pending</span>}
                </span>
                {opt.id === value && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
              </button>
            ))}
          </div>
          {query.trim() && !exactMatch && (
            <button type="button" onClick={addNew} disabled={adding}
              className="border-t border-stone-100 px-3 py-2.5 text-sm text-amber-700 font-semibold flex items-center gap-2 hover:bg-amber-50 disabled:opacity-50">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add &ldquo;{query.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
