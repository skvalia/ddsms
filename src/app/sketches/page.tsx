import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { SketchesListClient } from "@/components/SketchesListClient";

export default async function SketchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";
  const { data: sketches } = await supabase
    .from("sketches")
    .select("*, inspiration:inspirations(concept_name), assigned_designer:designers(name), sketch_artist:sketch_artists(name)")
    .order("created_at", { ascending: false });

  return (
    <AppShell userName={userName}>
      <SketchesListClient
        sketches={(sketches as any[]) ?? []}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
