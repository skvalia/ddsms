import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { DssrDetailClient } from "@/components/DssrDetailClient";
import { notFound } from "next/navigation";
import type {
  Dssr,
  DssrVersion,
  DssrFile,
  Ssr,
  Comment,
  ActivityLog,
} from "@/types/database";

export default async function DssrDetailPage({
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

  const { data: dssr } = await supabase
    .from("dssr")
    .select("*, party:parties(*)")
    .eq("id", id)
    .maybeSingle();

  if (!dssr) notFound();

  const [
    { data: versions },
    { data: files },
    { data: ssrs },
    { data: comments },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from("dssr_versions")
      .select("*")
      .eq("dssr_id", id)
      .order("version_number", { ascending: false }),
    supabase
      .from("dssr_files")
      .select("*")
      .eq("dssr_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("ssr")
      .select("*, party:parties(*)")
      .eq("dssr_id", id)
      .order("entry_date", { ascending: false }),
    supabase
      .from("comments")
      .select("*")
      .eq("dssr_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("activity_logs")
      .select("*")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <AppShell userName={userName}>
      <DssrDetailClient
        dssr={dssr as Dssr}
        versions={(versions as DssrVersion[]) ?? []}
        files={(files as DssrFile[]) ?? []}
        ssrs={(ssrs as Ssr[]) ?? []}
        comments={(comments as Comment[]) ?? []}
        activity={(activity as ActivityLog[]) ?? []}
        userId={user?.id ?? ""}
      />
    </AppShell>
  );
}
