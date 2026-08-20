"use client";

import { useState } from "react";
import { FileText, Film, Upload, Loader2, Trash2, Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FileItem = {
  id: string;
  file_path: string;
  file_type: string | null;
  label?: string | null;
  stage?: string | null;
};

type Props = {
  files: FileItem[];
  bucket: string;
  getPublicUrl: (path: string) => string;
  onUpload?: (file: File) => Promise<void>;
  uploading?: boolean;
  groupByStage?: boolean;
  table?: string; // "dssr_files" or "ssr_files"
};

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXT = ["mp4", "mov", "avi"];

export function bucketPublicUrl(bucket: string, path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export function FileGallery({ files, bucket, getPublicUrl, onUpload, uploading, groupByStage, table }: Props) {
  const supabase = createClient();
  const [localFiles, setLocalFiles] = useState(files);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function deleteFile(file: FileItem) {
    if (!confirm("Delete this file? This cannot be undone.")) return;
    // Delete from storage
    await supabase.storage.from(bucket).remove([file.file_path]);
    // Delete from DB
    const tbl = table || (bucket === "dssr-files" ? "dssr_files" : "ssr_files");
    await supabase.from(tbl).delete().eq("id", file.id);
    setLocalFiles(prev => prev.filter(f => f.id !== file.id));
  }

  async function saveLabel(id: string) {
    const tbl = table || (bucket === "dssr-files" ? "dssr_files" : "ssr_files");
    await supabase.from(tbl).update({ label: editLabel || null }).eq("id", id);
    setLocalFiles(prev => prev.map(f => f.id === id ? { ...f, label: editLabel || null } : f));
    setEditingId(null);
  }

  function renderFile(f: FileItem) {
    const ext = f.file_path.split(".").pop()?.toLowerCase() || "";
    const url = getPublicUrl(f.file_path);
    const isImage = IMAGE_EXT.includes(ext);
    const isVideo = VIDEO_EXT.includes(ext);

    return (
      <div key={f.id} className="relative group">
        {/* File thumbnail */}
        <div className="aspect-square rounded-xl overflow-hidden bg-(--color-paper) border border-(--color-line) relative">
          {isImage ? (
            <button onClick={() => setLightbox(url)} className="w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={f.label || ""} className="w-full h-full object-cover" />
            </button>
          ) : (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="w-full h-full flex flex-col items-center justify-center gap-1 text-(--color-ink-soft)">
              {isVideo ? <Film className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              <span className="text-[10px] uppercase">{ext}</span>
            </a>
          )}

          {/* Delete button - top right */}
          <button
            onClick={() => deleteFile(f)}
            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
            title="Delete file"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>

        {/* Label / stage */}
        <div className="mt-1">
          {editingId === f.id ? (
            <div className="flex items-center gap-1">
              <input autoFocus value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveLabel(f.id)}
                className="flex-1 text-xs rounded border border-(--color-line) px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-(--color-thread)"
              />
              <button onClick={() => saveLabel(f.id)} className="text-(--color-thread)"><Check className="w-3 h-3" /></button>
              <button onClick={() => setEditingId(null)} className="text-(--color-ink-soft)"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="text-[10px] text-(--color-ink-soft) truncate flex-1">
                {f.label || f.stage || ext.toUpperCase()}
              </p>
              <button
                onClick={() => { setEditingId(f.id); setEditLabel(f.label || ""); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                title="Edit label"
              >
                <Pencil className="w-2.5 h-2.5 text-(--color-ink-soft)" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group by stage if requested
  const grouped = groupByStage
    ? localFiles.reduce((acc, f) => {
        const key = f.stage || "General";
        if (!acc[key]) acc[key] = [];
        acc[key].push(f);
        return acc;
      }, {} as Record<string, FileItem[]>)
    : { All: localFiles };

  return (
    <div>
      {Object.entries(grouped).map(([stage, stageFiles]) => (
        <div key={stage} className="mb-4">
          {groupByStage && (
            <p className="text-xs font-semibold text-(--color-thread) mb-2">{stage}</p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {stageFiles.map(renderFile)}
          </div>
        </div>
      ))}

      {/* Upload button */}
      {onUpload && (
        <label className="mt-2 flex flex-col items-center justify-center gap-1 aspect-square w-20 rounded-xl border-2 border-dashed border-(--color-line) cursor-pointer hover:border-(--color-thread) transition-colors">
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-(--color-ink-soft)" />
          ) : (
            <>
              <Upload className="w-5 h-5 text-(--color-ink-soft)" />
              <span className="text-[10px] text-(--color-ink-soft)">Add file</span>
            </>
          )}
          <input type="file" className="hidden" disabled={uploading}
            onChange={(e) => { const f = e.target.files?.[0]; if (f && onUpload) onUpload(f); }} />
        </label>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setLightbox(null)}>
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
