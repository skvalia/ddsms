"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Lightbulb,
  PencilRuler,
  FileStack,
  ListChecks,
  LogOut,
  Search,
  Settings,
  Images,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/library", label: "Design Library", icon: Images },
  { href: "/inspirations", label: "Inspiration", icon: Lightbulb },
  { href: "/sketches", label: "Sketches", icon: PencilRuler },
  { href: "/dssr", label: "DSSR", icon: FileStack },
  { href: "/ssr", label: "SSR", icon: ListChecks },
];

export function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-(--color-paper) flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-(--color-surface) border-r border-(--color-line) sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-(--color-line)">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-(--color-thread) flex items-center justify-center text-white text-sm font-bold">D</div>
            <div>
              <p className="text-sm font-bold tracking-tight leading-none">DDSMS</p>
              <p className="text-[10px] text-(--color-ink-soft) mt-0.5">Design & Sampling</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? "bg-(--color-thread-soft) text-(--color-thread) font-semibold"
                         : "text-(--color-ink-soft) hover:bg-(--color-paper) hover:text-(--color-ink)"}`}>
                <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-(--color-line) space-y-1">
          <Link href="/settings/master-data"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-(--color-ink-soft) hover:bg-(--color-paper) hover:text-(--color-ink) transition-colors">
            <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
            Manage Data
          </Link>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-(--color-thread-soft) flex items-center justify-center text-(--color-thread) text-xs font-semibold shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate flex-1">{userName}</p>
            <button onClick={handleLogout} aria-label="Sign out"
              className="text-(--color-ink-soft) hover:text-(--color-status-issue) p-1.5 rounded-md hover:bg-(--color-paper) transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 bg-(--color-surface)/95 backdrop-blur border-b border-(--color-line) px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-(--color-thread) flex items-center justify-center text-white text-xs font-bold">D</div>
            <span className="text-sm font-bold">DDSMS</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings/master-data" aria-label="Manage data" className="p-2 rounded-lg text-(--color-ink-soft) hover:bg-(--color-paper)">
              <Settings className="w-5 h-5" />
            </Link>
            <Link href="/search" aria-label="Search" className="p-2 rounded-lg text-(--color-ink-soft) hover:bg-(--color-paper)">
              <Search className="w-5 h-5" />
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden sticky bottom-0 z-30 bg-(--color-surface)/95 backdrop-blur border-t border-(--color-line) flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors ${
                  active ? "text-(--color-thread)" : "text-(--color-ink-soft)"}`}>
                <item.icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className="truncate w-full text-center px-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}