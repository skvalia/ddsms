"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatusPill } from "./StatusPill";
import { StatusTimeline } from "./StatusTimeline";
import { FileGallery, bucketPublicUrl } from "./FileGallery";
import { TrackingPanel } from "./TrackingPanel";
import {
  ssrStatusColor,
  ssrStatusBg,
} from "@/lib/status-colors";
import {
  SSR_STATUSES,
  SSR_FILE_STAGES,
  ISSUE_TYPES,
  type Ssr,
  type SsrFile,
  type SsrFileStage,
  type StatusHistory,
  type Comment,
  type SsrStatus,
  type IssueType,
} from "@/types/database";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";

export function SsrDetailClient({
  ssr,
  files,
  history,
  comments,
  userId,
}: {
  ssr: Ssr;
  files: SsrFile[];
  history: StatusHistory[];
  comments: Comment[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [currentStatus, setCurrentStatus] = useState<SsrStatus>(ssr.status);
  const [issueType, setIssueType] = useState<IssueType | "">(ssr.issue_type || "");
  const [statusLoading, setStatusLoading] = useState(false);
  const [localHistory, setLocalHistory] = useState(history);
  const [localFiles, setLocalFiles] = useState(files);
  const [localComments, setLocalComments] = useState(comments);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [uploadStage, setUploadStage] = useState<SsrFileStage>(
    defaultStageForStatus(ssr.status)
  );

  async function handleStatusChange(newStatus: SsrStatus) {
    if (newStatus === currentStatus) return;
    setStatusLoading(true);

    const updates: Record<string, unknown> = { status: newStatus, created_by: userId };
    if (newStatus === "Issue" && issueType) {
      updates.issue_type = issueType;
    }
    if (newStatus !== "Issue") {
      updates.issue_type = null;
    }

    const { error } = await supabase.from("ssr").update(updates).eq("id", ssr.id);

    if (!error) {
      setCurrentStatus(newStatus);
      setUploadStage(defaultStageForStatus(newStatus));
      setLocalHistory((prev) => [
        {
          id: crypto.randomUUID(),
          ssr_id: ssr.id,
          old_status: currentStatus,
          new_status: newStatus,
          changed_by: userId,
          remarks: remarks || null,
          changed_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setRemarks("");

      // log activity
      await supabase.from("activity_logs").insert({
        entity_type: "ssr",
        entity_id: ssr.id,
        action: "status_changed",
        description: `Status changed from ${currentStatus} to ${newStatus}`,
        created_by: userId,
      });
    }
    setStatusLoading(false);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${ssr.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("ssr-files").upload(path, file);
    if (!error) {
      const latestHistoryId = localHistory[0]?.id || null;
      const { data, error: insertError } = await supabase
        .from("ssr_files")
        .insert({
          ssr_id: ssr.id,
          file_path: path,
          file_type: ext,
          stage: uploadStage,
          status_history_id: latestHistoryId,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (!insertError && data) {
        setLocalFiles((prev) => [data as SsrFile, ...prev]);
        await supabase.from("activity_logs").insert({
          entity_type: "ssr",
          entity_id: ssr.id,
          action: "file_uploaded",
          description: `${uploadStage} file uploaded: ${file.name}`,
          created_by: userId,
        });
      }
    }
    setUploading(false);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ ssr_id: ssr.id, body: commentText.trim(), created_by: userId })
      .select()
      .single();

    if (!error && data) {
      setLocalComments((prev) => [data as Comment, ...prev]);
      setCommentText("");
      await supabase.from("activity_logs").insert({
        entity_type: "ssr",
        entity_id: ssr.id,
        action: "comment_added",
        description: commentText.trim().slice(0, 100),
        created_by: userId,
      });
    }
    setCommentLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-(--color-ink-soft) mb-4 -ml-1"
      >
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-semibold tracking-tight">
            {ssr.design_number || "Untitled"}
          </h1>
          <p className="text-sm text-(--color-ink-soft) font-(family-name:--font-mono) mt-0.5">
            SSR {ssr.ssr_number}
            {ssr.sample_no ? ` · ${ssr.sample_no}` : ""}
          </p>
        </div>
        <StatusPill
          label={currentStatus}
          color={ssrStatusColor[currentStatus]}
          bg={ssrStatusBg[currentStatus]}
          className="mt-1"
        />
      </div>

      {ssr.dssr && (
        <Link
          href={`/dssr/${ssr.dssr.id}`}
          className="inline-block text-xs text-(--color-thread) font-medium mb-4 mt-1"
        >
          View DSSR {ssr.dssr.dssr_number} →
        </Link>
      )}

      {/* Details card */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5 mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Sample Details
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <DetailItem label="Party" value={ssr.party?.name} />
          <DetailItem label="Fabric" value={ssr.fabric} />
          <DetailItem label="Yarn" value={ssr.yarn} />
          <DetailItem label="Sample Type" value={ssr.sample_type} />
          <DetailItem label="Machine" value={ssr.machine} />
          <DetailItem label="Operator" value={ssr.operator} />
          <DetailItem label="Purpose" value={ssr.sample_purpose} />
          <DetailItem label="Entry Date" value={format(new Date(ssr.entry_date), "dd MMM yyyy")} />
          <DetailItem label="Approval" value={ssr.approval_status} />
          {ssr.party_dispatch_date && (
            <DetailItem
              label="Dispatched"
              value={format(new Date(ssr.party_dispatch_date), "dd MMM yyyy")}
            />
          )}
        </dl>
        {ssr.remarks && (
          <div className="mt-3 pt-3 border-t border-(--color-line)">
            <p className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-1">
              Remarks
            </p>
            <p className="text-sm">{ssr.remarks}</p>
          </div>
        )}
      </div>

      <TrackingPanel
        ssr={ssr}
        autoEdit={
          (currentStatus === "Sent To Outside Emb" && !ssr.outsource_challan_no) ||
          (currentStatus === "Dyeing" && !ssr.dyeing_challan_no)
        }
      />

      {/* Status update */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Update Status
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {SSR_STATUSES.map((status) => {
            const active = status === currentStatus;
            return (
              <button
                key={status}
                disabled={statusLoading}
                onClick={() => handleStatusChange(status)}
                className="disabled:opacity-50"
              >
                <StatusPill
                  label={status}
                  color={active ? "#fff" : ssrStatusColor[status]}
                  bg={active ? ssrStatusColor[status] : ssrStatusBg[status]}
                />
              </button>
            );
          })}
        </div>

        {currentStatus === "Issue" && (
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1.5 text-(--color-ink-soft)">
              Issue Type
            </label>
            <select
              value={issueType}
              onChange={async (e) => {
                const val = e.target.value as IssueType;
                setIssueType(val);
                await supabase.from("ssr").update({ issue_type: val }).eq("id", ssr.id);
              }}
              className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
            >
              <option value="">Select issue type</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Add a note for this status change (optional)"
            className="flex-1 rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
          />
        </div>

        <h3 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mt-5 mb-3">
          Timeline
        </h3>
        <StatusTimeline history={localHistory} />
      </div>

      {/* Files */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-1">
          Sample Journey — Photos &amp; Files
        </h2>
        <p className="text-xs text-(--color-ink-soft) mb-3">
          Every concept, sketch, EMB and sample photo is tagged to a stage so the full
          development sequence is preserved.
        </p>

        <div className="mb-3">
          <label className="block text-xs font-medium mb-1.5 text-(--color-ink-soft)">
            Tag new upload as
          </label>
          <select
            value={uploadStage}
            onChange={(e) => setUploadStage(e.target.value as SsrFileStage)}
            className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
          >
            {SSR_FILE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <FileGallery
          files={localFiles}
          bucket="ssr-files"
          getPublicUrl={(path) => bucketPublicUrl("ssr-files", path)}
          onUpload={handleUpload}
          uploading={uploading}
          groupByStage
        />
      </div>

      {/* Comments */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Comments
        </h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-thread)"
          />
          <button
            onClick={handleAddComment}
            disabled={commentLoading || !commentText.trim()}
            className="rounded-lg bg-(--color-thread) text-white px-3 disabled:opacity-50"
          >
            {commentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="space-y-3">
          {localComments.map((c) => (
            <div key={c.id} className="text-sm">
              <p>{c.body}</p>
              <p className="text-xs text-(--color-ink-soft) mt-0.5">
                {format(new Date(c.created_at), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
          ))}
          {localComments.length === 0 && (
            <p className="text-sm text-(--color-ink-soft)">No comments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-(--color-ink-soft)">{label}</dt>
      <dd className="font-medium mt-0.5">{value}</dd>
    </div>
  );
}

function defaultStageForStatus(status: SsrStatus): SsrFileStage {
  switch (status) {
    case "YTR":
      return "Concept";
    case "On Machine":
      return "On Machine";
    case "Mending":
      return "On Machine";
    case "Dyeing":
      return "Dyeing";
    case "Packing":
    case "Done":
    case "Completed":
      return "Sample Photo";
    case "Sent To Outside Emb":
      return "EMB";
    default:
      return "General";
  }
}
