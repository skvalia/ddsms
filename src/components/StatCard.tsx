import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  href?: string;
};

export function StatCard({ label, value, icon: Icon, color, bg, href }: StatCardProps) {
  const content = (
    <div className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-4 flex items-center gap-3.5 h-full transition-transform active:scale-[0.98]">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <p className="font-(family-name:--font-display) text-2xl font-semibold leading-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs text-(--color-ink-soft) truncate leading-tight mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
