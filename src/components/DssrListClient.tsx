"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { DssrCard } from "./DssrCard";
import { dssrStatusColor, dssrStatusBg } from "@/lib/status-colors";
import { DSSR_STATUSES, type Dssr, type DssrStatus } from "@/types/database";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

function CollapsibleGroup({ status, items }: { status: string; items: Dssr[] }) {
  const [open, setOpen] = useState(false);
  const color = dssrStatusColor[status as DssrStatus] || "#8a8478";
  const bg = dssrStatusBg[status as DssrStatus] || "#f1efec";
  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl overflow-hidden mb-3">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-(--color-paper) transition-colors">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-sm font-semibold">{status}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ color, backgroundColor: bg }}>
            {items.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-(--color-ink-soft)" />
               : <ChevronDown className="w-4 h-4 text-(--color-ink-soft)" />}
      </button>
      {open && (
        <div className="border-t border-(--color-line) p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(dssr => <DssrCard key={dssr.id} dssr={dssr} />)}
        </div>
      )}
    </div>
  );
}

export function DssrListClient({
  initialData,
  initialStatus,
}: {
  initialData: Dssr[];
  initialStatus?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DssrStatus | "All">(
    (initialStatus as DssrStatus) || "All"
  );

  const filtered = useMemo(() => {
    return initialData.filter((d) => {
      const matchSearch =
        !search ||
        d.design_number?.toLowerCase().includes(search.toLowerCase()) ||
        d.dssr_number?.toLowerCase().includes(search.toLowerCase()) ||
        (d.party as any)?.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || d.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter, initialData]);

  // Group by status
  const grouped = useMemo(() => {
    const g: Record<string, Dssr[]> = {};
    filtered.forEach(d => {
      if (!g[d.status]) g[d.status] = [];
      g[d.status].push(d);
    });
    return g;
  }, [filtered]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
            Design Records
          </h1>
          <p className="text-sm text-(--color-ink-soft) mt-0.5">{filtered.length} designs</p>
        </div>
        <Link href="/dssr/new"
          className="bg-(--color-thread) text-white px-4 py-2 rounded-xl text-sm font-semibold">
          + New DSSR
        </Link>
      </div>

      {/* Search + filter */}
      <div className="mb-5">
        <FilterBar
          search={search}
          onSearch={setSearch}
          statusFilter={statusFilter}
          onStatusFilter={(s) => setStatusFilter(s as DssrStatus | "All")}
          statuses={["All", ...DSSR_STATUSES]}
          statusColors={dssrStatusColor}
          statusBgs={dssrStatusBg}
          count={filtered.length}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-(--color-ink-soft)">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">No design records found</p>
        </div>
      ) : (
        <div>
          {DSSR_STATUSES.filter(s => grouped[s]?.length > 0).map(status => (
            <CollapsibleGroup key={status} status={status} items={grouped[status]} />
          ))}
        </div>
      )}
    </div>
  );
}
