"use client";

import Link from "next/link";
import { ChevronLeft, Plus, Layers, Calendar, ImageOff } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function InspirationDetailClient({
  inspiration, sketches, supabaseUrl,
}: { inspiration: any; sketches: any[]; supabaseUrl: string }) {
  const router = useRouter();
  const photoUrl = inspiration.photo_path
    ? `${supabaseUrl}/storage/v1/object/public/inspiration-files/${inspiration.photo_path}`
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-16">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-stone-500 mb-4 -ml-1">
        <ChevronLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{inspiration.concept_name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
            {inspiration.party?.name && <span>{inspiration.party.name}</span>}
            {inspiration.season && <span>· {inspiration.season}</span>}
            {inspiration.design_count && (
              <span className="text-amber-700 font-medium">· {inspiration.design_count} designs planned</span>
            )}
          </div>
        </div>
        <Link href={`/sketches/new?inspiration=${inspiration.id}`}
          className="flex items-center gap-1.5 bg-amber-700 text-white rounded-xl px-3 py-2 text-sm font-semibold shrink-0">
          <Plus className="w-4 h-4" /> New Sketch
        </Link>
      </div>

      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={inspiration.concept_name}
          className="w-full max-h-80 object-contain rounded-2xl border border-stone-200 mb-4 bg-stone-50" />
      ) : (
        <div className="w-full h-48 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-center mb-4">
          <ImageOff className="w-10 h-10 text-stone-300" />
        </div>
      )}

      {inspiration.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-stone-700">{inspiration.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-1 text-xs text-stone-400 mb-6">
        <Calendar className="w-3 h-3" />
        Added {format(new Date(inspiration.created_at), "dd MMM yyyy")}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-stone-500">
            Sketches ({sketches.length})
          </h2>
          <Link href={`/sketches/new?inspiration=${inspiration.id}`}
            className="text-xs text-amber-700 font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> Add Sketch
          </Link>
        </div>

        {sketches.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl py-10 text-center">
            <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-400">No sketches yet</p>
            <Link href={`/sketches/new?inspiration=${inspiration.id}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-amber-700 font-medium">
              <Plus className="w-3.5 h-3.5" /> Create first sketch
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {sketches.map((sk) => {
              const skThumb = sk.photo_path
                ? `${supabaseUrl}/storage/v1/object/public/sketch-files/${sk.photo_path}`
                : null;
              return (
                <Link key={sk.id} href={`/sketches/${sk.id}`}
                  className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-stone-50">
                    {skThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={skThumb} alt={sk.sketch_number} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff className="w-6 h-6 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold">{sk.sketch_number || "Sketch"}</p>
                    <p className="text-xs text-stone-400">{sk.status || "Draft"}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
