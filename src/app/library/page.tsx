import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LibraryContent } from "./client";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users").select("full_name")
    .eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LibraryContent userName={userName} />
    </Suspense>
  );
}
