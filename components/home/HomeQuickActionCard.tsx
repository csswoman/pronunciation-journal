import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

interface HomeQuickActionCardProps {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}

export default function HomeQuickActionCard({
  href,
  icon,
  title,
  description,
}: HomeQuickActionCardProps) {
  return (
    <Link
      href={href}
      className="focus-ring group flex items-center gap-3 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised px-4 py-3 transition-colors hover:border-[var(--accent-border)] hover:bg-surface-sunken"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded text-[var(--primary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
        <p className="font-caption leading-snug text-[var(--text-tertiary)]">{description}</p>
      </div>
      <ArrowRight size={14} className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}
