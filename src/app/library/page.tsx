import { Suspense } from "react";
import { LibraryContent } from "./client";

export const dynamic = "force-dynamic";

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <LibraryContent />
    </Suspense>
  );
}
