"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { SsrCard } from "./SsrCard";
import { StatusPill } from "./StatusPill";
import { ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import { SSR_STATUSES, type Ssr, type SsrStatus } from "@/types/database";
import { LayoutGrid, List as ListIcon } from "lucide-react";

export function SsrListClient({
  initialData,
  initialStatus,
}: {
  initialData: Ssr[];
  initialStatus?: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SsrStatus | "All">(
    (initialStatus as SsrStatus) || "All"
  );
  const [view, setView] = useState<"list" | "kanban">(
    initialStatus ? "list" : "list"
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
          r.ssr_number?.toLowerCase().includes(q) ||
          r.sample_no?.toLowerCase().includes(q) ||
          r.party?.name?.toLowerCase().includes(q) ||
          r.fabric?.toLowerCase().includes(q) ||
          r.yarn?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [initialData, search, statusFilter]);

  const kanbanGroups = useMemo(() => {
    const groups: Record<string, Ssr[]> = {};
    for (const status of SSR_STATUSES) groups[status] = [];
    for (const row of filtered) {
      groups[row.status]?.push(row);
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search design no, party, fabric..."
        addHref="/ssr/new"
        addLabel="New SSR sample"
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
          {SSR_STATUSES.map((status) => {
            const count = initialData.filter((r) => r.status === status).length;
            const active = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="shrink-0"
              >
                <StatusPill
                  label={`${status} (${count})`}
                  color={active ? "#fff" : ssrStatusColor[status]}
                  bg={active ? ssrStatusColor[status] : ssrStatusBg[status]}
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 bg-(--color-surface) border border-(--color-line) rounded-lg p-1 w-fit">
          <button
            onClick={() => setView("list")}
            className={`p-1.5 rounded-md ${
              view === "list" ? "bg-(--color-thread-soft) text-(--color-thread)" : "text-(--color-ink-soft)"
            }`}
            aria-label="List view"
          >
            <ListIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("kanban")}
            className={`p-1.5 rounded-md ${
              view === "kanban" ? "bg-(--color-thread-soft) text-(--color-thread)" : "text-(--color-ink-soft)"
            }`}
            aria-label="Kanban view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </FilterBar>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-(--color-ink-soft)">
          <p className="text-sm">No samples match your filters.</p>
        </div>
      )}

      {view === "list" && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((ssr) => (
            <SsrCard key={ssr.id} ssr={ssr} />
          ))}
        </div>
      )}

      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
          {SSR_STATUSES.map((status) => (
            <div key={status} className="shrink-0 w-72">
              <div className="flex items-center justify-between mb-2 px-1">
                <StatusPill
                  label={status}
                  color={ssrStatusColor[status]}
                  bg={ssrStatusBg[status]}
                />
                <span className="text-xs text-(--color-ink-soft) font-medium">
                  {kanbanGroups[status].length}
                </span>
              </div>
              <div className="space-y-2">
                {kanbanGroups[status].map((ssr) => (
                  <SsrCard key={ssr.id} ssr={ssr} />
                ))}
                {kanbanGroups[status].length === 0 && (
                  <div className="border border-dashed border-(--color-line) rounded-2xl py-6 text-center text-xs text-(--color-ink-soft)">
                    Empty
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
