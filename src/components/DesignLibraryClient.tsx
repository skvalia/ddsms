"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { dssrStatusColor, dssrStatusBg, ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import { Search, LayoutGrid, List, ImageOff, SlidersHorizontal, X } from "lucide-react";
import { format } from "date-fns";

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];

function getPublicUrl(supabaseUrl: string, bucket: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

function getFirstImage(files: any[], supabaseUrl: string, bucket: string) {
  if (!files || files.length === 0) return null;
  const imageFile = files.find((f: any) => {
    const ext = f.file_path?.split(".").pop()?.toLowerCase();
    return IMAGE_EXT.includes(ext || "");
  });
  if (!imageFile) return null;
  return getPublicUrl(supabaseUrl, bucket, imageFile.file_path);
}

const DSSR_STATUSES = [
  "New", "CAD Development", "EMB Development",
  "Ready For Sampling", "Sampling Active", "Approved", "Archived"
];

const SSR_STATUSES = [
  "YTR", "On Machine", "Issue", "Mending",
  "Dyeing", "Packing", "Done", "Sent To Outside Emb", "Completed"
];

type ViewMode = "grid" | "list";
type DataMode = "designs" | "samples";

export function DesignLibraryClient({
  dssrs,
  ssrs,
  supabaseUrl,
}: {
  dssrs: any[];
  ssrs: any[];
  supabaseUrl: string;
}) {
  const [dataMode, setDataMode] = useState<DataMode>("designs");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [partyFilter, setPartyFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);

  // Collect unique parties
  const allParties = useMemo(() => {
    const source = dataMode === "designs" ? dssrs : ssrs;
    const names = new Set(source.map((r) => r.party?.name).filter(Boolean));
    return Array.from(names).sort();
  }, [dataMode, dssrs, ssrs]);

  const statuses = dataMode === "designs" ? DSSR_STATUSES : SSR_STATUSES;

  const filtered = useMemo(() => {
    const source = dataMode === "designs" ? dssrs : ssrs;
    return source.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        (dataMode === "designs"
          ? r.design_number?.toLowerCase().includes(q) ||
            r.dssr_number?.toLowerCase().includes(q) ||
            r.party?.name?.toLowerCase().includes(q) ||
            r.designer?.toLowerCase().includes(q)
          : r.design_number?.toLowerCase().includes(q) ||
            r.ssr_number?.toLowerCase().includes(q) ||
            r.party?.name?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const matchParty = partyFilter === "All" || r.party?.name === partyFilter;
      return matchSearch && matchStatus && matchParty;
    });
  }, [search, statusFilter, partyFilter, dataMode, dssrs, ssrs]);

  // Stats
  const withPhotos = filtered.filter((r) => r.files && r.files.length > 0).length;
  const withoutPhotos = filtered.length - withPhotos;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 border-b border-(--color-line) bg-(--color-surface)">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
                Design Library
              </h1>
              <p className="text-sm text-(--color-ink-soft) mt-0.5">
                {filtered.length} records · {withPhotos} with photos · {withoutPhotos} without
              </p>
            </div>

            {/* Data mode toggle */}
            <div className="flex gap-1 bg-(--color-paper) border border-(--color-line) rounded-lg p-1">
              <button
                onClick={() => { setDataMode("designs"); setStatusFilter("All"); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  dataMode === "designs"
                    ? "bg-(--color-thread-soft) text-(--color-thread)"
                    : "text-(--color-ink-soft)"
                }`}
              >
                Designs (DSSR)
              </button>
              <button
                onClick={() => { setDataMode("samples"); setStatusFilter("All"); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  dataMode === "samples"
                    ? "bg-(--color-thread-soft) text-(--color-thread)"
                    : "text-(--color-ink-soft)"
                }`}
              >
                Samples (SSR)
              </button>
            </div>
          </div>

          {/* Search + controls row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-ink-soft)" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  dataMode === "designs"
                    ? "Search design no, party, designer..."
                    : "Search design no, SSR no, party..."
                }
                className="w-full rounded-xl border border-(--color-line) bg-(--color-paper) pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-(--color-ink-soft)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`rounded-xl border p-2.5 transition-colors ${
                showFilters || statusFilter !== "All" || partyFilter !== "All"
                  ? "border-(--color-thread) bg-(--color-thread-soft) text-(--color-thread)"
                  : "border-(--color-line) bg-(--color-surface) text-(--color-ink-soft)"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* View toggle */}
            <div className="flex gap-1 bg-(--color-surface) border border-(--color-line) rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md ${
                  viewMode === "grid" ? "bg-(--color-thread-soft) text-(--color-thread)" : "text-(--color-ink-soft)"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md ${
                  viewMode === "list" ? "bg-(--color-thread-soft) text-(--color-thread)" : "text-(--color-ink-soft)"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
                >
                  <option value="All">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">Party</label>
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
                >
                  <option value="All">All parties</option>
                  {allParties.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {(statusFilter !== "All" || partyFilter !== "All") && (
                <div className="flex items-end">
                  <button
                    onClick={() => { setStatusFilter("All"); setPartyFilter("All"); }}
                    className="text-xs font-medium text-(--color-thread) pb-2"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status chip row */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              onClick={() => setStatusFilter("All")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === "All"
                  ? "bg-(--color-ink) text-white border-(--color-ink)"
                  : "border-(--color-line) bg-(--color-surface) text-(--color-ink-soft)"
              }`}
            >
              All ({(dataMode === "designs" ? dssrs : ssrs).length})
            </button>
            {statuses.map((s) => {
              const count = (dataMode === "designs" ? dssrs : ssrs).filter((r) => r.status === s).length;
              if (count === 0) return null;
              const colorMap = dataMode === "designs" ? dssrStatusColor : ssrStatusColor;
              const bgMap = dataMode === "designs" ? dssrStatusBg : ssrStatusBg;
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className="shrink-0"
                >
                  <StatusPill
                    label={`${s} (${count})`}
                    color={active ? "#fff" : colorMap[s as keyof typeof colorMap]}
                    bg={active ? colorMap[s as keyof typeof colorMap] : bgMap[s as keyof typeof bgMap]}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 && (
            <div className="text-center py-20 text-(--color-ink-soft)">
              <ImageOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No records match your search.</p>
            </div>
          )}

          {viewMode === "grid" && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map((r) => (
                <DesignCard
                  key={r.id}
                  record={r}
                  dataMode={dataMode}
                  supabaseUrl={supabaseUrl}
                />
              ))}
            </div>
          )}

          {viewMode === "list" && filtered.length > 0 && (
            <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--color-line) bg-(--color-paper)">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft) w-12"></th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft)">Design No</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft)">Party</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft)">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft) hidden md:table-cell">
                      {dataMode === "designs" ? "Designer" : "Fabric"}
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-ink-soft) hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-line)">
                  {filtered.map((r) => {
                    const thumb = getFirstImage(r.files, supabaseUrl, dataMode === "designs" ? "dssr-files" : "ssr-files");
                    const href = dataMode === "designs" ? `/dssr/${r.id}` : `/ssr/${r.id}`;
                    const colorMap = dataMode === "designs" ? dssrStatusColor : ssrStatusColor;
                    const bgMap = dataMode === "designs" ? dssrStatusBg : ssrStatusBg;
                    return (
                      <tr key={r.id} className="hover:bg-(--color-paper) transition-colors">
                        <td className="px-3 py-2">
                          <Link href={href}>
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-(--color-paper) border border-(--color-line) flex items-center justify-center">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageOff className="w-4 h-4 text-(--color-ink-soft) opacity-40" />
                              )}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-2">
                          <Link href={href} className="font-semibold hover:text-(--color-thread) truncate block max-w-40">
                            {r.design_number || (dataMode === "designs" ? r.dssr_number : r.ssr_number)}
                          </Link>
                        </td>
                        <td className="px-4 py-2 text-(--color-ink-soft)">{r.party?.name || "—"}</td>
                        <td className="px-4 py-2">
                          <StatusPill
                            label={r.status}
                            color={colorMap[r.status as keyof typeof colorMap] || "#8a8478"}
                            bg={bgMap[r.status as keyof typeof bgMap] || "#f1efec"}
                          />
                        </td>
                        <td className="px-4 py-2 text-(--color-ink-soft) hidden md:table-cell">
                          {dataMode === "designs" ? (r.designer || "—") : (r.fabric || "—")}
                        </td>
                        <td className="px-4 py-2 text-(--color-ink-soft) hidden lg:table-cell">
                          {format(new Date(r.created_at), "dd MMM yyyy")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DesignCard({
  record,
  dataMode,
  supabaseUrl,
}: {
  record: any;
  dataMode: DataMode;
  supabaseUrl: string;
}) {
  const bucket = dataMode === "designs" ? "dssr-files" : "ssr-files";
  const href = dataMode === "designs" ? `/dssr/${record.id}` : `/ssr/${record.id}`;
  const colorMap = dataMode === "designs" ? dssrStatusColor : ssrStatusColor;
  const bgMap = dataMode === "designs" ? dssrStatusBg : ssrStatusBg;
  const thumb = getFirstImage(record.files, supabaseUrl, bucket);

  const title = record.design_number || (dataMode === "designs" ? record.dssr_number : record.ssr_number) || "—";
  const sub = record.party?.name;

  return (
    <Link href={href} className="group block">
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl overflow-hidden transition-shadow hover:shadow-md active:scale-[0.98] transition-transform">
        {/* Thumbnail */}
        <div className="aspect-square bg-(--color-paper) relative overflow-hidden">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-(--color-ink-soft)">
              <ImageOff className="w-8 h-8 opacity-20" />
              <span className="text-[10px] opacity-40 font-medium">No photo</span>
            </div>
          )}
          {/* Status pill overlay */}
          <div className="absolute top-2 left-2">
            <StatusPill
              label={record.status}
              color={colorMap[record.status as keyof typeof colorMap] || "#8a8478"}
              bg={bgMap[record.status as keyof typeof bgMap] || "#f1efec"}
            />
          </div>
        </div>

        {/* Card info */}
        <div className="px-3 py-2.5">
          <p className="font-(family-name:--font-display) text-sm font-semibold leading-tight truncate">
            {title}
          </p>
          {sub && (
            <p className="text-xs text-(--color-ink-soft) mt-0.5 truncate">{sub}</p>
          )}
          {record.files && record.files.length > 0 && (
            <p className="text-[10px] text-(--color-ink-soft) mt-1">
              {record.files.length} file{record.files.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
