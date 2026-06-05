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
      className="group flex items-center gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised px-5 py-5 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent-border)]"
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
        <p className="mt-0.5 text-sm leading-snug text-[var(--text-secondary)]">{description}</p>
      </div>
      <ArrowRight size={16} className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}
