"use client";

import { useState } from "react";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

function Section({ title, count, color, children, defaultOpen = true }: {
  title: string; count: number; color?: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden mb-3">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{title}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
            count === 0 ? "bg-green-100 text-green-700" :
            count <= 3 ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {count === 0 ? "Free" : `${count} pending`}
          </span>
          {color && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${color}`}>{title.split("—")[0].trim()}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
      </button>
      {open && count > 0 && (
        <div className="px-4 pb-3 border-t border-stone-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function WorkloadPage() {
  const supabase = createClient();
  const [designers, setDesigners] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [pendingDssr, setPendingDssr] = useState<any[]>([]);
  const [pendingSketches, setPendingSketches] = useState<any[]>([]);
  const [ssrByMachine, setSsrByMachine] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [
        { data: d }, { data: a }, { data: pd }, { data: ps }, { data: pssr }
      ] = await Promise.all([
        supabase.from("designers").select("id, name").order("name"),
        supabase.from("sketch_artists").select("id, name").order("name"),
        supabase.from("dssr").select("id, dssr_number, design_number, status, designer_id, party:parties(name)")
          .not("designer_id", "is", null)
          .in("status", ["New", "CAD Development", "EMB Development", "Ready For Sampling"]),
        supabase.from("sketches").select("id, sketch_number, status, sketch_artist_id, inspiration:inspirations(concept_name)")
          .not("sketch_artist_id", "is", null)
          .in("status", ["Draft", "In Progress"]),
        supabase.from("ssr").select("id, ssr_number, design_number, status, machine_type, party:parties(name)")
          .not("machine_type", "is", null)
          .not("status", "in", '("Done","Completed")')
          .order("machine_type"),
      ]);

      setDesigners(d ?? []);
      setArtists(a ?? []);
      setPendingDssr(pd ?? []);
      setPendingSketches(ps ?? []);

      const byMachine: Record<string, any[]> = {};
      (pssr ?? []).forEach((s: any) => {
        const mt = s.machine_type || "Unassigned";
        if (!byMachine[mt]) byMachine[mt] = [];
        byMachine[mt].push(s);
      });
      setSsrByMachine(byMachine);
      setLoading(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const machineColors: Record<string, string> = {
    "Schiffli": "bg-blue-100 text-blue-700",
    "Multi": "bg-purple-100 text-purple-700",
    "Aari": "bg-green-100 text-green-700",
    "Cording": "bg-amber-100 text-amber-700",
    "Pentacut": "bg-pink-100 text-pink-700",
    "Schiffli-Cording": "bg-indigo-100 text-indigo-700",
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Team Workload</h1>
      <p className="text-sm text-stone-500 mb-6">Tap any section to expand or collapse</p>

      {/* Machine Type */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">🔧 By Machine Type</h2>
      {Object.keys(ssrByMachine).length === 0
        ? <p className="text-sm text-stone-400 mb-6">No pending samples with machine type assigned.</p>
        : Object.entries(ssrByMachine).map(([machine, ssrs]) => (
          <Section key={machine} title={machine} count={ssrs.length}>
            <div className="space-y-1.5 pt-3">
              {ssrs.map((s: any) => (
                <Link key={s.id} href={`/ssr/${s.id}`}
                  className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2 hover:bg-stone-100">
                  <span className="font-medium">
                    {s.ssr_number}
                    {s.design_number && <span className="text-stone-400 ml-2 font-normal">{s.design_number}</span>}
                  </span>
                  <span className="text-xs text-stone-400">{s.status}</span>
                </Link>
              ))}
            </div>
          </Section>
        ))
      }

      {/* Designers */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 mt-6">🎨 Designers</h2>
      {designers.length === 0
        ? <p className="text-sm text-stone-400 mb-4">No designers. <Link href="/settings/master-data" className="text-amber-700 font-medium">Add →</Link></p>
        : designers.map((d: any) => {
          const work = pendingDssr.filter((r: any) => r.designer_id === d.id);
          return (
            <Section key={d.id} title={d.name} count={work.length} defaultOpen={work.length > 0}>
              <div className="space-y-1.5 pt-3">
                {work.map((r: any) => (
                  <Link key={r.id} href={`/dssr/${r.id}`}
                    className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2 hover:bg-stone-100">
                    <span>{r.dssr_number}{r.design_number ? ` — ${r.design_number}` : ""}</span>
                    <span className="text-xs text-stone-400">{r.status}</span>
                  </Link>
                ))}
              </div>
            </Section>
          );
        })
      }

      {/* Sketch Artists */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 mt-6">✏️ Sketch Artists</h2>
      {artists.length === 0
        ? <p className="text-sm text-stone-400">No sketch artists. <Link href="/settings/master-data" className="text-amber-700 font-medium">Add →</Link></p>
        : artists.map((a: any) => {
          const work = pendingSketches.filter((r: any) => r.sketch_artist_id === a.id);
          return (
            <Section key={a.id} title={a.name} count={work.length} defaultOpen={work.length > 0}>
              <div className="space-y-1.5 pt-3">
                {work.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2">
                    <span>{r.sketch_number}{r.inspiration?.concept_name ? ` — ${r.inspiration.concept_name}` : ""}</span>
                    <span className="text-xs text-stone-400">{r.status}</span>
                  </div>
                ))}
              </div>
            </Section>
          );
        })
      }
    </div>
  );
}
