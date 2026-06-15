// Core domain types matching the Supabase schema (Phase 1)

export type DssrStatus =
  | "New"
  | "CAD Development"
  | "EMB Development"
  | "Ready For Sampling"
  | "Sampling Active"
  | "Approved"
  | "Archived";

export type DssrPriority = "High" | "Medium" | "Low";

export type SketchStatus =
  | "New"
  | "Under Design"
  | "Review"
  | "Approved"
  | "Rejected";

export type SsrStatus =
  | "YTR"
  | "On Machine"
  | "Issue"
  | "Mending"
  | "Dyeing"
  | "Packing"
  | "Done"
  | "Sent To Outside Emb"
  | "Completed";

export type IssueType =
  | "Fabric Issue"
  | "Yarn Issue"
  | "Design Issue"
  | "Machine Issue"
  | "Operator Issue";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected" | "Completed";

export type InspirationCategory =
  | "Floral"
  | "Geometric"
  | "Placement"
  | "Border"
  | "Allover"
  | "Ethnic"
  | "Kids"
  | "Womenswear"
  | "Menswear"
  | "Luxury";

export interface Party {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  customer_name: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inspiration {
  id: string;
  project_id: string | null;
  title: string | null;
  category: InspirationCategory | null;
  tags: string[];
  notes: string | null;
  image_path: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Sketch {
  id: string;
  sketch_code: string | null;
  project_id: string | null;
  designer: string | null;
  description: string | null;
  status: SketchStatus;
  created_at: string;
  updated_at: string;
}

export interface SketchFile {
  id: string;
  sketch_id: string;
  file_path: string;
  file_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface Dssr {
  id: string;
  dssr_number: string;
  design_number: string | null;
  project_id: string | null;
  party_id: string | null;
  designer: string | null;
  design_type: string | null;
  target_completion_date: string | null;
  priority: DssrPriority;
  status: DssrStatus;
  current_version: number;
  created_at: string;
  updated_at: string;
  // joined
  party?: Party | null;
}

export interface DssrVersion {
  id: string;
  dssr_id: string;
  version_number: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface DssrFile {
  id: string;
  dssr_id: string;
  dssr_version_id: string | null;
  file_path: string;
  file_type: string | null;
  label: string | null;
  stage: DssrFileStage;
  uploaded_by: string | null;
  created_at: string;
}

export interface Ssr {
  id: string;
  ssr_number: string;
  sample_no: string | null;
  dssr_id: string | null;
  party_id: string | null;
  design_number: string | null;
  fabric: string | null;
  yarn: string | null;
  sample_type: string | null;
  machine: string | null;
  operator: string | null;
  sample_purpose: string | null;
  status: SsrStatus;
  issue_type: IssueType | null;
  dyeing_required: boolean;
  dyeing_name: string | null;
  dyeing_challan_no: string | null;
  dyeing_sent_date: string | null;
  dyeing_receive_date: string | null;
  outsource_unit_name: string | null;
  outsource_challan_no: string | null;
  outsource_sent_date: string | null;
  outsource_receive_date: string | null;
  party_dispatch_date: string | null;
  approval_status: ApprovalStatus;
  remarks: string | null;
  entry_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  party?: Party | null;
  dssr?: Dssr | null;
}

export interface SsrFile {
  id: string;
  ssr_id: string;
  file_path: string;
  file_type: string | null;
  label: string | null;
  stage: SsrFileStage;
  status_history_id: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface StatusHistory {
  id: string;
  ssr_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  remarks: string | null;
  changed_at: string;
}

export interface Comment {
  id: string;
  dssr_id: string | null;
  ssr_id: string | null;
  body: string;
  created_by: string | null;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string | null;
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
}

export type SsrFileStage =
  | "Concept"
  | "Sketch"
  | "CAD"
  | "EMB"
  | "On Machine"
  | "Sample Photo"
  | "Dyeing"
  | "Final"
  | "General";

export type DssrFileStage = "Concept" | "Sketch" | "CAD" | "EMB" | "General";

export const SSR_FILE_STAGES: SsrFileStage[] = [
  "Concept",
  "Sketch",
  "CAD",
  "EMB",
  "On Machine",
  "Sample Photo",
  "Dyeing",
  "Final",
  "General",
];

export const DSSR_FILE_STAGES: DssrFileStage[] = [
  "Concept",
  "Sketch",
  "CAD",
  "EMB",
  "General",
];

export const SSR_STATUSES: SsrStatus[] = [
  "YTR",
  "On Machine",
  "Issue",
  "Mending",
  "Dyeing",
  "Packing",
  "Done",
  "Sent To Outside Emb",
  "Completed",
];

export const DSSR_STATUSES: DssrStatus[] = [
  "New",
  "CAD Development",
  "EMB Development",
  "Ready For Sampling",
  "Sampling Active",
  "Approved",
  "Archived",
];

export const SKETCH_STATUSES: SketchStatus[] = [
  "New",
  "Under Design",
  "Review",
  "Approved",
  "Rejected",
];

export const INSPIRATION_CATEGORIES: InspirationCategory[] = [
  "Floral",
  "Geometric",
  "Placement",
  "Border",
  "Allover",
  "Ethnic",
  "Kids",
  "Womenswear",
  "Menswear",
  "Luxury",
];

export const ISSUE_TYPES: IssueType[] = [
  "Fabric Issue",
  "Yarn Issue",
  "Design Issue",
  "Machine Issue",
  "Operator Issue",
];
