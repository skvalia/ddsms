import type { SsrStatus, DssrStatus, SketchStatus, DssrPriority } from "@/types/database";

export const ssrStatusColor: Record<SsrStatus, string> = {
  YTR: "#8a8478",
  "On Machine": "#2563eb",
  Issue: "#dc2626",
  Mending: "#d97706",
  Dyeing: "#7c3aed",
  Packing: "#0891b2",
  Done: "#16a34a",
  "Sent To Outside Emb": "#be185d",
  Completed: "#15803d",
};

export const ssrStatusBg: Record<SsrStatus, string> = {
  YTR: "#f1efec",
  "On Machine": "#dbeafe",
  Issue: "#fee2e2",
  Mending: "#fef3c7",
  Dyeing: "#ede9fe",
  Packing: "#cffafe",
  Done: "#dcfce7",
  "Sent To Outside Emb": "#fce7f3",
  Completed: "#dcfce7",
};

export const dssrStatusColor: Record<DssrStatus, string> = {
  New: "#8a8478",
  "CAD Development": "#2563eb",
  "EMB Development": "#7c3aed",
  "Ready For Sampling": "#0891b2",
  "Sampling Active": "#d97706",
  Approved: "#16a34a",
  Archived: "#a8a29e",
};

export const dssrStatusBg: Record<DssrStatus, string> = {
  New: "#f1efec",
  "CAD Development": "#dbeafe",
  "EMB Development": "#ede9fe",
  "Ready For Sampling": "#cffafe",
  "Sampling Active": "#fef3c7",
  Approved: "#dcfce7",
  Archived: "#f4f4f5",
};

export const sketchStatusColor: Record<SketchStatus, string> = {
  New: "#8a8478",
  "Under Design": "#2563eb",
  Review: "#d97706",
  Approved: "#16a34a",
  Rejected: "#dc2626",
};

export const sketchStatusBg: Record<SketchStatus, string> = {
  New: "#f1efec",
  "Under Design": "#dbeafe",
  Review: "#fef3c7",
  Approved: "#dcfce7",
  Rejected: "#fee2e2",
};

export const priorityColor: Record<DssrPriority, string> = {
  High: "#dc2626",
  Medium: "#d97706",
  Low: "#16a34a",
};

export const priorityBg: Record<DssrPriority, string> = {
  High: "#fee2e2",
  Medium: "#fef3c7",
  Low: "#dcfce7",
};
