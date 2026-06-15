import { createClient } from "@/lib/supabase/server";
import type { SsrStatus, DssrStatus } from "@/types/database";

export interface DashboardStats {
  totalDesigns: number;
  activeDssr: number;
  pendingCad: number;
  pendingEmb: number;
  readyForSampling: number;
  ssrCounts: Record<SsrStatus, number>;
}

const SSR_DASHBOARD_STATUSES: SsrStatus[] = [
  "YTR",
  "On Machine",
  "Issue",
  "Mending",
  "Dyeing",
  "Packing",
  "Done",
];

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [dssrRes, ssrRes] = await Promise.all([
    supabase.from("dssr").select("id, status"),
    supabase.from("ssr").select("id, status"),
  ]);

  const dssrRows = dssrRes.data ?? [];
  const ssrRows = ssrRes.data ?? [];

  const dssrStatusCounts: Record<string, number> = {};
  for (const row of dssrRows) {
    const status = row.status as DssrStatus;
    dssrStatusCounts[status] = (dssrStatusCounts[status] ?? 0) + 1;
  }

  const ssrCounts: Record<SsrStatus, number> = {
    YTR: 0,
    "On Machine": 0,
    Issue: 0,
    Mending: 0,
    Dyeing: 0,
    Packing: 0,
    Done: 0,
    "Sent To Outside Emb": 0,
    Completed: 0,
  };
  for (const row of ssrRows) {
    const status = row.status as SsrStatus;
    if (status in ssrCounts) ssrCounts[status]++;
  }

  return {
    totalDesigns: dssrRows.length,
    activeDssr:
      (dssrStatusCounts["Sampling Active"] ?? 0) +
      (dssrStatusCounts["CAD Development"] ?? 0) +
      (dssrStatusCounts["EMB Development"] ?? 0) +
      (dssrStatusCounts["Ready For Sampling"] ?? 0) +
      (dssrStatusCounts["New"] ?? 0),
    pendingCad: dssrStatusCounts["New"] ?? 0,
    pendingEmb: dssrStatusCounts["CAD Development"] ?? 0,
    readyForSampling: dssrStatusCounts["Ready For Sampling"] ?? 0,
    ssrCounts,
  };
}

export { SSR_DASHBOARD_STATUSES };
