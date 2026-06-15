"use client";

import { useState } from "react";
import { FileText, Film, Download, X, Upload, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type FileItem = {
  id: string;
  file_path: string;
  file_type: string | null;
  label?: string | null;
  stage?: string | null;
};

const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif"];
const VIDEO_EXT = ["mp4", "mov"];

function getExt(path: string) {
  return path.split(".").pop()?.toLowerCase() || "";
}

export function FileGallery({
  files,
  getPublicUrl,
  onUpload,
  uploading,
  groupByStage = false,
}: {
  files: FileItem[];
  bucket: string;
  getPublicUrl: (path: string) => string;
  onUpload?: (file: File) => void;
  uploading?: boolean;
  groupByStage?: boolean;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (groupByStage) {
    const groups = new Map<string, FileItem[]>();
    for (const f of files) {
      const key = f.stage || "General";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }

    return (
      <div className="space-y-4">
        {Array.from(groups.entries()).map(([stage, stageFiles]) => (
          <div key={stage}>
            <p className="text-xs font-semibold text-(--color-thread) mb-1.5">{stage}</p>
            <GalleryGrid
              files={stageFiles}
              getPublicUrl={getPublicUrl}
              setLightbox={setLightbox}
            />
          </div>
        ))}
        {onUpload && (
          <UploadTile onUpload={onUpload} uploading={uploading} />
        )}
        {files.length === 0 && !onUpload && (
          <p className="text-sm text-(--color-ink-soft) py-2">No files uploaded yet.</p>
        )}
        <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <GalleryGrid files={files} getPublicUrl={getPublicUrl} setLightbox={setLightbox} />
        {onUpload && <UploadTile onUpload={onUpload} uploading={uploading} inline />}
      </div>

      {files.length === 0 && !onUpload && (
        <p className="text-sm text-(--color-ink-soft) py-4">No files uploaded yet.</p>
      )}

      <Lightbox url={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function GalleryGrid({
  files,
  getPublicUrl,
  setLightbox,
}: {
  files: FileItem[];
  getPublicUrl: (path: string) => string;
  setLightbox: (url: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 contents">
      {files.map((f) => {
        const ext = getExt(f.file_path);
        const url = getPublicUrl(f.file_path);
        if (IMAGE_EXT.includes(ext)) {
          return (
            <button
              key={f.id}
              onClick={() => setLightbox(url)}
              className="aspect-square rounded-xl overflow-hidden bg-(--color-paper) border border-(--color-line)"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={f.label || ""} className="w-full h-full object-cover" />
            </button>
          );
        }
        const Icon = VIDEO_EXT.includes(ext) ? Film : FileText;
        return (
          <a
            key={f.id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square rounded-xl bg-(--color-paper) border border-(--color-line) flex flex-col items-center justify-center gap-1 text-(--color-ink-soft)"
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] uppercase font-semibold">{ext}</span>
          </a>
        );
      })}
    </div>
  );
}

function UploadTile({
  onUpload,
  uploading,
  inline,
}: {
  onUpload: (file: File) => void;
  uploading?: boolean;
  inline?: boolean;
}) {
  return (
    <label
      className={`aspect-square rounded-xl border border-dashed border-(--color-line) flex flex-col items-center justify-center gap-1 text-(--color-ink-soft) cursor-pointer hover:border-(--color-thread) hover:text-(--color-thread) transition-colors ${
        inline ? "" : "max-w-[120px]"
      }`}
    >
      {uploading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <Upload className="w-5 h-5" />
          <span className="text-[10px] font-medium">Add file</span>
        </>
      )}
      <input
        type="file"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Lightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  if (!url) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button className="absolute top-4 right-4 text-white p-2" onClick={onClose} aria-label="Close">
        <X className="w-6 h-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
      <a
        href={url}
        download
        className="absolute bottom-4 right-4 text-white bg-white/10 backdrop-blur p-2.5 rounded-full"
        onClick={(e) => e.stopPropagation()}
      >
        <Download className="w-5 h-5" />
      </a>
    </div>
  );
}

export function bucketPublicUrl(bucket: string, path: string) {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
