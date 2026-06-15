import Link from "next/link";
import { StatusPill } from "./StatusPill";
import { dssrStatusColor, dssrStatusBg, priorityColor, priorityBg } from "@/lib/status-colors";
import type { Dssr } from "@/types/database";
import { format } from "date-fns";
import { User } from "lucide-react";

export function DssrCard({ dssr }: { dssr: Dssr }) {
  return (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Link href={`/dssr/${dssr.id}`} className="min-w-0 block flex-1">
          <p className="font-(family-name:--font-display) text-base font-semibold leading-tight truncate">
            {dssr.design_number || dssr.dssr_number}
          </p>
          <p className="text-xs text-(--color-ink-soft) mt-0.5 font-(family-name:--font-mono)">
            {dssr.dssr_number} · v{dssr.current_version}
          </p>
        </Link>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Link href={`/dssr?status=${encodeURIComponent(dssr.status)}`} aria-label={`Show all ${dssr.status} designs`}>
            <StatusPill
              label={dssr.status}
              color={dssrStatusColor[dssr.status]}
              bg={dssrStatusBg[dssr.status]}
            />
          </Link>
          <StatusPill
            label={dssr.priority}
            color={priorityColor[dssr.priority]}
            bg={priorityBg[dssr.priority]}
          />
        </div>
      </div>

      <Link href={`/dssr/${dssr.id}`} className="block">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-(--color-ink-soft)">
          {dssr.party?.name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {dssr.party.name}
            </span>
          )}
          {dssr.designer && <span>Designer: {dssr.designer}</span>}
          {dssr.design_type && <span>{dssr.design_type}</span>}
        </div>

        {dssr.target_completion_date && (
          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-(--color-line)">
            <span className="text-xs text-(--color-ink-soft)">
              Target: {format(new Date(dssr.target_completion_date), "dd MMM yyyy")}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}
