import { Suspense } from "react";
import { MasterDataForm } from "./form";

export const dynamic = "force-dynamic";

export default function MasterDataPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MasterDataForm />
    </Suspense>
  );
}
