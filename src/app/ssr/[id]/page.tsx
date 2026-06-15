import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { SsrDetailClient } from "@/components/SsrDetailClient";
import { notFound } from "next/navigation";
import type { Ssr, SsrFile, StatusHistory, Comment } from "@/types/database";

export default async function SsrDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: ssr } = await supabase
    .from("ssr")
    .select("*, party:parties(*), dssr:dssr(*)")
    .eq("id", id)
    .maybeSingle();

  if (!ssr) notFound();

  const [{ data: files }, { data: history }, { data: comments }] = await Promise.all([
    supabase.from("ssr_files").select("*").eq("ssr_id", id).order("created_at", { ascending: false }),
    supabase.from("status_history").select("*").eq("ssr_id", id).order("changed_at", { ascending: false }),
    supabase
      .from("comments")
      .select("*")
      .eq("ssr_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell userName={userName}>
      <SsrDetailClient
        ssr={ssr as Ssr}
        files={(files as SsrFile[]) ?? []}
        history={(history as StatusHistory[]) ?? []}
        comments={(comments as Comment[]) ?? []}
        userId={user?.id ?? ""}
      />
    </AppShell>
  );
}
