import { Suspense } from "react";
import { NewInspirationForm } from "./form";

export const dynamic = "force-dynamic";

export default function NewInspirationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewInspirationForm />
    </Suspense>
  );
}
