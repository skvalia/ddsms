"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { DssrCard } from "./DssrCard";
import { StatusPill } from "./StatusPill";
import { dssrStatusColor, dssrStatusBg } from "@/lib/status-colors";
import { DSSR_STATUSES, type Dssr, type DssrStatus } from "@/types/database";

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
    let rows = initialData;
    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.design_number?.toLowerCase().includes(q) ||
          r.dssr_number?.toLowerCase().includes(q) ||
          r.designer?.toLowerCase().includes(q) ||
          r.party?.name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [initialData, search, statusFilter]);

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search design no, party, designer..."
        addHref="/dssr/new"
        addLabel="New DSSR"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => setStatusFilter("All")}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === "All"
                ? "bg-(--color-ink) text-white border-(--color-ink)"
                : "border-(--color-line) text-(--color-ink-soft) bg-(--color-surface)"
            }`}
          >
            All ({initialData.length})
          </button>
          {DSSR_STATUSES.map((status) => {
            const count = initialData.filter((r) => r.status === status).length;
            const active = statusFilter === status;
            return (
              <button key={status} onClick={() => setStatusFilter(status)} className="shrink-0">
                <StatusPill
                  label={`${status} (${count})`}
                  color={active ? "#fff" : dssrStatusColor[status]}
                  bg={active ? dssrStatusColor[status] : dssrStatusBg[status]}
                />
              </button>
            );
          })}
        </div>
      </FilterBar>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-(--color-ink-soft)">
          <p className="text-sm">No designs match your filters.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((dssr) => (
          <DssrCard key={dssr.id} dssr={dssr} />
        ))}
      </div>
    </div>
  );
}
