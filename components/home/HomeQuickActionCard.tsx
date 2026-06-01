import Link from "next/link";
import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";

interface HomeQuickActionCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
}

export default function HomeQuickActionCard({
  href,
  icon,
  title,
  description,
  badge,
}: HomeQuickActionCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-1 flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent-border)]"
    >
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="flex items-center gap-2">
        <p className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</p>
        {badge ? <Badge label={badge} variant="default" size="sm" /> : null}
      </div>
      <p className="mt-1 text-[13px] leading-snug text-[var(--text-tertiary)]">{description}</p>
    </Link>
  );
}
