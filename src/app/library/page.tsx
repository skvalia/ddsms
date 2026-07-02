import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DesignLibraryClient } from "@/components/DesignLibraryClient";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  // Fetch DSSRs with their party and latest file (for thumbnail)
  const { data: dssrs } = await supabase
    .from("dssr")
    .select("*, party:parties(*), files:dssr_files(*)")
    .order("updated_at", { ascending: false })
    .limit(200);

  // Fetch SSRs with their files for sample photos
  const { data: ssrs } = await supabase
    .from("ssr")
    .select("*, party:parties(*), files:ssr_files(*)")
    .order("updated_at", { ascending: false })
    .limit(200);

  // Get public URLs for all storage files
  const { data: storageFiles } = await supabase.storage
    .from("dssr-files")
    .list("", { limit: 1000 });

  return (
    <AppShell userName={userName}>
      <DesignLibraryClient
        dssrs={(dssrs as any[]) ?? []}
        ssrs={(ssrs as any[]) ?? []}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
