"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";

function Section({ title, count, children, defaultOpen = false }: {
  title: string; count: number; children?: React.ReactNode; defaultOpen?: boolean;
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
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
      </button>
      {open && count > 0 && (
        <div className="px-4 pb-3 border-t border-stone-100 pt-3 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

const machineColors: Record<string, string> = {
  "Schiffli": "bg-blue-100 text-blue-700",
  "Multi": "bg-purple-100 text-purple-700",
  "Aari": "bg-green-100 text-green-700",
  "Cording": "bg-amber-100 text-amber-700",
  "Pentacut": "bg-pink-100 text-pink-700",
  "Schiffli-Cording": "bg-indigo-100 text-indigo-700",
};

export function WorkloadClient({ designers, artists, pendingDssr, pendingSketches, dssrByMachine }: {
  designers: any[];
  artists: any[];
  pendingDssr: any[];
  pendingSketches: any[];
  dssrByMachine: Record<string, any[]>;
}) {
  return (
    <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
      <Link href="/" className="flex items-center gap-1 text-sm text-stone-500 mb-4 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-2xl font-bold tracking-tight mb-1">Team Workload</h1>
      <p className="text-sm text-stone-500 mb-6">Click any row to expand and see pending work</p>

      {/* ── Machine Type (from DSSR) ── */}
      <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
        🔧 DSSR Pending by Machine Type
      </h2>
      {Object.keys(dssrByMachine).length === 0 ? (
        <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-6 text-center text-sm text-stone-400 mb-6">
          No DSSRs with machine type assigned yet. Set machine type on DSSR via Edit.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {Object.entries(dssrByMachine).map(([machine, dssrs]) => (
            <Section key={machine} title={machine} count={dssrs.length}>
              {dssrs.map((d: any) => (
                <Link key={d.id} href={`/dssr/${d.id}`}
                  className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2 hover:bg-stone-100">
                  <div className="min-w-0">
                    <span className="font-medium">{d.dssr_number}</span>
                    {d.design_number && (
                      <span className="text-stone-400 ml-2 text-xs">{d.design_number}</span>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ml-2 font-medium ${
                    machineColors[machine] || "bg-stone-100 text-stone-600"
                  }`}>{d.status}</span>
                </Link>
              ))}
            </Section>
          ))}
        </div>
      )}

      {/* ── Designers + Sketch Artists ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">🎨 Designers</h2>
          {designers.length === 0 ? (
            <p className="text-sm text-stone-400">No designers added.{" "}
              <Link href="/settings/master-data" className="text-amber-700 font-medium">Add →</Link>
            </p>
          ) : designers.map((d: any) => {
            const work = pendingDssr.filter((r: any) => r.designer_id === d.id);
            return (
              <Section key={d.id} title={d.name} count={work.length}>
                {work.map((r: any) => (
                  <Link key={r.id} href={`/dssr/${r.id}`}
                    className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2 hover:bg-stone-100">
                    <span className="truncate">
                      {r.dssr_number}
                      {r.design_number ? <span className="text-stone-400 ml-1 text-xs">— {r.design_number}</span> : null}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0 ml-2">{r.status}</span>
                  </Link>
                ))}
              </Section>
            );
          })}
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">✏️ Sketch Artists</h2>
          {artists.length === 0 ? (
            <p className="text-sm text-stone-400">No sketch artists added.{" "}
              <Link href="/settings/master-data" className="text-amber-700 font-medium">Add →</Link>
            </p>
          ) : artists.map((a: any) => {
            const work = pendingSketches.filter((r: any) => r.sketch_artist_id === a.id);
            return (
              <Section key={a.id} title={a.name} count={work.length}>
                {work.map((r: any) => (
                  <div key={r.id}
                    className="flex items-center justify-between text-sm bg-stone-50 rounded-lg px-3 py-2">
                    <span className="truncate">
                      {r.sketch_number}
                      {r.inspiration?.concept_name
                        ? <span className="text-stone-400 ml-1 text-xs">— {r.inspiration.concept_name}</span>
                        : null}
                    </span>
                    <span className="text-xs text-stone-400 shrink-0 ml-2">{r.status}</span>
                  </div>
                ))}
              </Section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
