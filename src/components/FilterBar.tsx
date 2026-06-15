"use client";

import { Search, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

type FilterBarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  addHref?: string;
  addLabel?: string;
  children?: React.ReactNode; // status chips etc.
  onToggleFilters?: () => void;
  filtersOpen?: boolean;
};

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  addHref,
  addLabel = "Add",
  children,
  onToggleFilters,
  filtersOpen,
}: FilterBarProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-ink-soft)" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-(--color-line) bg-(--color-surface) pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread) focus:border-transparent"
          />
        </div>
        {onToggleFilters && (
          <button
            onClick={onToggleFilters}
            aria-label="Toggle filters"
            className={`rounded-xl border p-2.5 transition-colors ${
              filtersOpen
                ? "border-(--color-thread) bg-(--color-thread-soft) text-(--color-thread)"
                : "border-(--color-line) bg-(--color-surface) text-(--color-ink-soft)"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
        {addHref && (
          <Link
            href={addHref}
            aria-label={addLabel}
            className="rounded-xl bg-(--color-thread) text-white p-2.5 flex items-center justify-center shrink-0 active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
