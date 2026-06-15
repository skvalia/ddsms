import { StatusPill } from "./StatusPill";
import { ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import type { StatusHistory } from "@/types/database";
import { format } from "date-fns";

export function StatusTimeline({ history }: { history: StatusHistory[] }) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-(--color-ink-soft) py-4">
        No status changes recorded yet.
      </p>
    );
  }

  // newest first already expected, but sort defensively
  const sorted = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  return (
    <ol className="relative pl-5">
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-(--color-line)" />
      {sorted.map((h) => (
        <li key={h.id} className="relative pb-5 last:pb-0">
          <span
            className="absolute -left-5 top-1 w-3.5 h-3.5 rounded-full border-2 border-(--color-surface)"
            style={{ background: ssrStatusColor[h.new_status as keyof typeof ssrStatusColor] || "#8a8478" }}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <StatusPill
              label={h.new_status}
              color={ssrStatusColor[h.new_status as keyof typeof ssrStatusColor] || "#8a8478"}
              bg={ssrStatusBg[h.new_status as keyof typeof ssrStatusBg] || "#f1efec"}
            />
            <span className="text-xs text-(--color-ink-soft)">
              {format(new Date(h.changed_at), "dd MMM yyyy, HH:mm")}
            </span>
          </div>
          {h.remarks && (
            <p className="text-sm text-(--color-ink-soft) mt-1">{h.remarks}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
