import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InspirationDetailClient } from "@/components/InspirationDetailClient";

export default async function InspirationDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name").eq("id", user?.id ?? "").maybeSingle();
  const userName = profile?.full_name || user?.email || "User";

  const [{ data: insp }, { data: sketches }, { data: photos }, { data: artists }] = await Promise.all([
    supabase.from("inspirations").select("*, party:parties(name), assigned_sketcher:sketch_artists(id,name)").eq("id", id).maybeSingle(),
    supabase.from("sketches").select("*").eq("inspiration_id", id).order("created_at", { ascending: false }),
    supabase.from("inspiration_photos").select("*").eq("inspiration_id", id).order("sort_order"),
    supabase.from("sketch_artists").select("id, name").order("name"),
  ]);

  if (!insp) return notFound();

  return (
    <AppShell userName={userName}>
      <InspirationDetailClient
        insp={insp as any}
        sketches={(sketches as any[]) ?? []}
        photos={(photos as any[]) ?? []}
        artists={(artists as any[]) ?? []}
        userId={user?.id ?? ""}
        supabaseUrl={process.env.NEXT_PUBLIC_SUPABASE_URL!}
      />
    </AppShell>
  );
}
