import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SketchDetailClient } from "@/components/SketchDetailClient";

export default async function SketchDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [{ data: sketch }, { data: dssrs }, { data: designers }] = await Promise.all([
    supabase.from("sketches").select("*, inspiration:inspirations(id, concept_name), assigned_designer:designers(id,name)").eq("id", id).maybeSingle(),
    supabase.from("dssr").select("*, party:parties(name)").eq("sketch_id", id).order("created_at", { ascending: false }),
    supabase.from("designers").select("id, name").order("name"),
  ]);

  if (!sketch) return notFound();

  return (
    <AppShell userName={userName}>
      <SketchDetailClient
        sketch={sketch as any}
        dssrs={(dssrs as any[]) ?? []}
        designers={(designers as any[]) ?? []}
        userId={user?.id ?? ""}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
