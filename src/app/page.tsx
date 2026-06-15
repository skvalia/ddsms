import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { getDashboardStats } from "@/lib/dashboard";
import { ssrStatusColor, ssrStatusBg } from "@/lib/status-colors";
import {
  FileStack,
  Sparkles,
  PencilRuler,
  Layers,
  CheckCircle2,
  Clock,
  Cog,
  AlertTriangle,
  Wrench,
  Droplets,
  Package,
  PackageCheck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default async function HomePage() {
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
  const stats = await getDashboardStats();

  const ssrCards = [
    { key: "YTR", label: "YTR Samples", icon: Clock, color: ssrStatusColor.YTR, bg: ssrStatusBg.YTR },
    { key: "On Machine", label: "On Machine", icon: Cog, color: ssrStatusColor["On Machine"], bg: ssrStatusBg["On Machine"] },
    { key: "Issue", label: "Issue Samples", icon: AlertTriangle, color: ssrStatusColor.Issue, bg: ssrStatusBg.Issue },
    { key: "Mending", label: "Mending", icon: Wrench, color: ssrStatusColor.Mending, bg: ssrStatusBg.Mending },
    { key: "Dyeing", label: "Dyeing", icon: Droplets, color: ssrStatusColor.Dyeing, bg: ssrStatusBg.Dyeing },
    { key: "Packing", label: "Packing", icon: Package, color: ssrStatusColor.Packing, bg: ssrStatusBg.Packing },
    { key: "Done", label: "Done", icon: PackageCheck, color: ssrStatusColor.Done, bg: ssrStatusBg.Done },
  ] as const;

  return (
    <AppShell userName={userName}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="mb-6">
          <p className="text-sm text-(--color-ink-soft)">Welcome back,</p>
          <h1 className="font-(family-name:--font-display) text-2xl md:text-3xl font-semibold tracking-tight">
            {userName.split(" ")[0]}
          </h1>
        </div>

        {/* Design pipeline overview */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
            Design Pipeline
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Total Designs"
              value={stats.totalDesigns}
              icon={FileStack}
              color="#c4621a"
              bg="#f3e2d2"
              href="/dssr"
            />
            <StatCard
              label="Active DSSR"
              value={stats.activeDssr}
              icon={Layers}
              color="#2563eb"
              bg="#dbeafe"
              href="/dssr"
            />
            <StatCard
              label="Pending CAD"
              value={stats.pendingCad}
              icon={PencilRuler}
              color="#d97706"
              bg="#fef3c7"
              href="/dssr?status=New"
            />
            <StatCard
              label="Ready For Sampling"
              value={stats.readyForSampling}
              icon={CheckCircle2}
              color="#16a34a"
              bg="#dcfce7"
              href="/dssr?status=Ready For Sampling"
            />
          </div>
        </section>

        {/* Sampling status overview */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
            Sampling Status (SSR)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ssrCards.map((c) => (
              <StatCard
                key={c.key}
                label={c.label}
                value={stats.ssrCounts[c.key]}
                icon={c.icon}
                color={c.color}
                bg={c.bg}
                href={`/ssr?status=${encodeURIComponent(c.key)}`}
              />
            ))}
          </div>
        </section>

        {/* Quick links */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-(--color-ink-soft) mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              href="/inspirations"
              className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <Sparkles className="w-5 h-5 text-(--color-thread)" strokeWidth={2.25} />
              <span className="text-sm font-medium">Add Inspiration</span>
            </Link>
            <Link
              href="/sketches/new"
              className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <PencilRuler className="w-5 h-5 text-(--color-thread)" strokeWidth={2.25} />
              <span className="text-sm font-medium">New Sketch</span>
            </Link>
            <Link
              href="/dssr/new"
              className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <FileStack className="w-5 h-5 text-(--color-thread)" strokeWidth={2.25} />
              <span className="text-sm font-medium">New DSSR</span>
            </Link>
            <Link
              href="/ssr/new"
              className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <ExternalLink className="w-5 h-5 text-(--color-thread)" strokeWidth={2.25} />
              <span className="text-sm font-medium">New SSR Sample</span>
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
