import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import type { Ssr } from "@/types/database";
import { format } from "date-fns";
import { Layers } from "lucide-react";

export function SsrCard({ ssr }: { ssr: Ssr }) {
  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link href={`/ssr/${ssr.id}`} className="min-w-0 block flex-1">
          <p className="font-(family-name:--font-display) text-base font-semibold leading-tight truncate">
            {ssr.design_number || "—"}
          </p>
          <p className="text-xs text-(--color-ink-soft) mt-0.5 font-(family-name:--font-mono)">
            SSR {ssr.ssr_number}
            {ssr.sample_no ? ` · ${ssr.sample_no}` : ""}
          </p>
        </Link>
        <Link
          href={`/ssr?status=${encodeURIComponent(ssr.status)}`}
          aria-label={`Show all ${ssr.status} samples`}
          className="shrink-0"
        >
          <StatusPill
            label={ssr.status}
            color={ssrStatusColor[ssr.status]}
            bg={ssrStatusBg[ssr.status]}
          />
        </Link>
      </div>

      <Link href={`/ssr/${ssr.id}`} className="block">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-ink-soft)">
          {ssr.party?.name && (
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" /> {ssr.party.name}
            </span>
          )}
          {ssr.fabric && <span>{ssr.fabric}</span>}
          {ssr.yarn && <span>{ssr.yarn}</span>}
          {ssr.sample_type && <span>{ssr.sample_type}</span>}
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-(--color-line)">
          <span className="text-xs text-(--color-ink-soft)">
            {format(new Date(ssr.entry_date), "dd MMM yyyy")}
          </span>
          {ssr.issue_type && (
            <span className="text-xs font-medium text-(--color-status-issue)">
              {ssr.issue_type}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
