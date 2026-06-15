"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { StatusPill } from "./StatusPill";
import { SsrCard } from "./SsrCard";
import { FileGallery, bucketPublicUrl } from "./FileGallery";
import {
  dssrStatusColor,
  dssrStatusBg,
  priorityColor,
  priorityBg,
} from "@/lib/status-colors";
import {
  DSSR_STATUSES,
  DSSR_FILE_STAGES,
  type Dssr,
  type DssrVersion,
  type DssrFile,
  type DssrFileStage,
  type Ssr,
  type Comment,
  type ActivityLog,
  type DssrStatus,
} from "@/types/database";
import { ChevronLeft, Send, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";

export function DssrDetailClient({
  dssr,
  versions,
  files,
  ssrs,
  comments,
  activity,
  userId,
}: {
  dssr: Dssr;
  versions: DssrVersion[];
  files: DssrFile[];
  ssrs: Ssr[];
  comments: Comment[];
  activity: ActivityLog[];
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [currentStatus, setCurrentStatus] = useState<DssrStatus>(dssr.status);
  const [statusLoading, setStatusLoading] = useState(false);
  const [localFiles, setLocalFiles] = useState(files);
  const [localComments, setLocalComments] = useState(comments);
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<DssrFileStage>("Concept");

  async function handleStatusChange(newStatus: DssrStatus) {
    if (newStatus === currentStatus) return;
    setStatusLoading(true);
    const { error } = await supabase
      .from("dssr")
      .update({ status: newStatus })
      .eq("id", dssr.id);

    if (!error) {
      setCurrentStatus(newStatus);
      await supabase.from("activity_logs").insert({
        entity_type: "dssr",
        entity_id: dssr.id,
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
    const path = `${dssr.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage.from("dssr-files").upload(path, file);
    if (!error) {
      const { data, error: insertError } = await supabase
        .from("dssr_files")
        .insert({
          dssr_id: dssr.id,
          file_path: path,
          file_type: ext,
          stage: uploadStage,
          uploaded_by: userId,
        })
        .select()
        .single();

      if (!insertError && data) {
        setLocalFiles((prev) => [data as DssrFile, ...prev]);
        await supabase.from("activity_logs").insert({
          entity_type: "dssr",
          entity_id: dssr.id,
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
      .insert({ dssr_id: dssr.id, body: commentText.trim(), created_by: userId })
      .select()
      .single();

    if (!error && data) {
      setLocalComments((prev) => [data as Comment, ...prev]);
      setCommentText("");
      await supabase.from("activity_logs").insert({
        entity_type: "dssr",
        entity_id: dssr.id,
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
            {dssr.design_number || dssr.dssr_number}
          </h1>
          <p className="text-sm text-(--color-ink-soft) font-(family-name:--font-mono) mt-0.5">
            {dssr.dssr_number} · Version {dssr.current_version}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 mt-1">
          <StatusPill
            label={currentStatus}
            color={dssrStatusColor[currentStatus]}
            bg={dssrStatusBg[currentStatus]}
          />
          <StatusPill
            label={dssr.priority}
            color={priorityColor[dssr.priority]}
            bg={priorityBg[dssr.priority]}
          />
        </div>
      </div>

      {/* Design details */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5 mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Design Details
        </h2>
        <dl className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
          <DetailItem label="Party" value={dssr.party?.name} />
          <DetailItem label="Designer" value={dssr.designer} />
          <DetailItem label="Design Type" value={dssr.design_type} />
          <DetailItem
            label="Target Date"
            value={
              dssr.target_completion_date
                ? format(new Date(dssr.target_completion_date), "dd MMM yyyy")
                : undefined
            }
          />
        </dl>
      </div>

      {/* Status update */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Update Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {DSSR_STATUSES.map((status) => {
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
                  color={active ? "#fff" : dssrStatusColor[status]}
                  bg={active ? dssrStatusColor[status] : dssrStatusBg[status]}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Versions */}
      {versions.length > 0 && (
        <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
            Versions
          </h2>
          <div className="space-y-2">
            {versions.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between text-sm py-1.5 border-b border-(--color-line) last:border-0"
              >
                <span className="font-medium">Version {v.version_number}</span>
                <span className="text-xs text-(--color-ink-soft)">
                  {format(new Date(v.created_at), "dd MMM yyyy")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files - CAD/EMB/Sketch/etc */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Files — Sketch / CAD / EMB / DST
        </h2>

        <div className="mb-3">
          <label className="block text-xs font-medium mb-1.5 text-(--color-ink-soft)">
            Tag new upload as
          </label>
          <select
            value={uploadStage}
            onChange={(e) => setUploadStage(e.target.value as DssrFileStage)}
            className="w-full rounded-lg border border-(--color-line) bg-(--color-paper) px-3 py-2 text-sm"
          >
            {DSSR_FILE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <FileGallery
          files={localFiles}
          bucket="dssr-files"
          getPublicUrl={(path) => bucketPublicUrl("dssr-files", path)}
          onUpload={handleUpload}
          uploading={uploading}
          groupByStage
        />
      </div>

      {/* All SSRs */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft)">
            All SSRs ({ssrs.length})
          </h2>
          <Link
            href={`/ssr/new?dssr=${dssr.id}`}
            className="flex items-center gap-1 text-xs font-medium text-(--color-thread)"
          >
            <Plus className="w-3.5 h-3.5" /> New SSR
          </Link>
        </div>
        {ssrs.length > 0 ? (
          <div className="space-y-2">
            {ssrs.map((ssr) => (
              <SsrCard key={ssr.id} ssr={ssr} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-(--color-ink-soft) bg-(--color-surface) border border-(--color-line) rounded-2xl p-4">
            No sampling executions yet for this design.
          </p>
        )}
      </div>

      {/* Activity timeline */}
      <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
          Activity Timeline
        </h2>
        {activity.length > 0 ? (
          <ul className="space-y-3">
            {activity.map((a) => (
              <li key={a.id} className="text-sm">
                <span className="font-medium">{a.description || a.action}</span>
                <span className="block text-xs text-(--color-ink-soft) mt-0.5">
                  {format(new Date(a.created_at), "dd MMM yyyy, HH:mm")}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-(--color-ink-soft)">No activity recorded yet.</p>
        )}
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
