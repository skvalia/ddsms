"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "./FilterBar";
import { SsrCard } from "./SsrCard";
import { StatusPill } from "./StatusPill";
import { ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import { SSR_STATUSES, type Ssr, type SsrStatus } from "@/types/database";
import { LayoutGrid, List as ListIcon, ChevronDown, ChevronUp } from "lucide-react";


function CollapsibleStatusGroups({ ssrs }: { ssrs: Ssr[] }) {
  const grouped = ssrs.reduce((acc, ssr) => {
    const s = ssr.status;
    if (!acc[s]) acc[s] = [];
    acc[s].push(ssr);
    return acc;
  }, {} as Record<string, Ssr[]>);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(grouped).map(s => [s, true]))
  );

  function toggle(status: string) {
    setOpenGroups(prev => ({ ...prev, [status]: !prev[status] }));
  }

  return (
    <div className="space-y-3">
      {SSR_STATUSES.filter(s => grouped[s]?.length > 0).map(status => (
        <div key={status} className="bg-(--color-surface) border border-(--color-line) rounded-2xl overflow-hidden">
          <button onClick={() => toggle(status)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-(--color-paper) transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{status}</span>
              <span className="text-xs bg-(--color-paper) text-(--color-ink-soft) px-2 py-0.5 rounded-full">
                {grouped[status].length}
              </span>
            </div>
            {openGroups[status]
              ? <ChevronUp className="w-4 h-4 text-(--color-ink-soft)" />
              : <ChevronDown className="w-4 h-4 text-(--color-ink-soft)" />}
          </button>
          {openGroups[status] && (
            <div className="flex flex-col gap-2 px-4 pb-3 border-t border-(--color-line)">
              {grouped[status].map(ssr => (
                <SsrCard key={ssr.id} ssr={ssr} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
        <CollapsibleStatusGroups ssrs={filtered} />
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
