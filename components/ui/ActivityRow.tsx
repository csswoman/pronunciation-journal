import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "@/components/icons";
import { cn } from "@/lib/cn";

// Planned structure:
// <ActivityRow> — whole-row link, English Journal design system
//   <NumberCircle> — 38px circular index/state marker
//   <RowMain> — title + subtitle
//   <RowMeta> — duration + chevron

interface ActivityRowProps {
  href: string;
  title: string;
  subtitle?: string;
  duration?: string;
  /** Number, icon, or check mark shown inside the 38px circle. */
  marker: ReactNode;
  className?: string;
}

export default function ActivityRow({
  href,
  title,
  subtitle,
  duration,
  marker,
  className,
}: ActivityRowProps) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring flex items-center gap-3 rounded-md py-2 transition-colors hover:bg-ej-surface-raised",
        className
      )}
    >
      <span className="flex size-[38px] shrink-0 items-center justify-center rounded-full bg-ej-field text-caption font-bold text-ink">
        {marker}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-body-sm font-semibold text-ej-text">{title}</span>
        {subtitle && (
          <span className="block truncate text-caption text-ej-text-muted">{subtitle}</span>
        )}
      </span>

      {duration && (
        <span className="shrink-0 text-caption text-ej-text-muted">· {duration}</span>
      )}
      <ChevronRight size={18} className="shrink-0 text-ej-text-faint" aria-hidden />
    </Link>
  );
}
