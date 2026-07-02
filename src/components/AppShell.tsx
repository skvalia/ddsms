"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Image as ImageIcon,
  PencilRuler,
  FileStack,
  ListChecks,
  Scissors,
  LogOut,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inspirations", label: "Inspiration", icon: ImageIcon },
  { href: "/sketches", label: "Sketches", icon: PencilRuler },
  { href: "/dssr", label: "DSSR", icon: FileStack },
  { href: "/ssr", label: "SSR", icon: ListChecks },
  { href: "/library", label: "Design Library", icon: GalleryHorizontalEnd },
];

export function AppShell({
  children,
  userName,
}: {
  children: React.ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col border-r border-(--color-line) bg-(--color-surface) sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="w-9 h-9 rounded-xl bg-(--color-thread) flex items-center justify-center rotate-3 shrink-0">
            <Scissors className="w-4.5 h-4.5 text-white -rotate-3" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-(family-name:--font-display) font-semibold text-sm leading-none">
              DDSMS
            </p>
            <p className="text-xs text-(--color-ink-soft) mt-0.5">Sampling System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-(--color-thread-soft) text-(--color-thread)"
                    : "text-(--color-ink-soft) hover:bg-(--color-paper) hover:text-(--color-ink)"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-(--color-line)">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-(--color-thread-soft) flex items-center justify-center text-(--color-thread) text-xs font-semibold shrink-0">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <p className="text-sm font-medium truncate flex-1">{userName}</p>
            <button
              onClick={handleLogout}
              aria-label="Sign out"
              className="text-(--color-ink-soft) hover:text-(--color-status-issue) p-1.5 rounded-md hover:bg-(--color-paper) transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-30 bg-(--color-surface)/95 backdrop-blur border-b border-(--color-line) px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-(--color-thread) flex items-center justify-center rotate-3">
              <Scissors className="w-4 h-4 text-white -rotate-3" strokeWidth={2.25} />
            </div>
            <p className="font-(family-name:--font-display) font-semibold text-base">DDSMS</p>
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="p-2 rounded-lg text-(--color-ink-soft) hover:bg-(--color-paper)"
          >
            <Search className="w-5 h-5" />
          </Link>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-(--color-surface)/95 backdrop-blur border-t border-(--color-line) px-2 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-stretch justify-between">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex flex-col items-center gap-1 py-2.5"
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-(--color-thread)" : "text-(--color-ink-soft)"
                    }`}
                    strokeWidth={active ? 2.5 : 2}
                  />
                  <span
                    className={`text-[10px] font-medium ${
                      active ? "text-(--color-thread)" : "text-(--color-ink-soft)"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
