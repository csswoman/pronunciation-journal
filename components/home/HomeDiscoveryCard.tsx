import Link from "next/link";
import type { ReactNode } from "react";
import Badge from "@/components/ui/Badge";

interface HomeDiscoveryCardProps {
  href: string;
  badge: string;
  title: string;
  description: string;
  footer: string;
  children?: ReactNode;
}

export default function HomeDiscoveryCard({
  href,
  badge,
  title,
  description,
  footer,
  children,
}: HomeDiscoveryCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 transition-[transform,border-color] duration-150 hover:-translate-y-0.5 hover:border-[var(--accent-border)]"
    >
      <Badge label={badge} variant="default" className="self-start" />
      {children ? <div className="mt-2">{children}</div> : null}
      {title ? (
        <h4
          className={`${children ? "mt-2" : "mt-2.5"} text-body-lg font-medium leading-tight text-[var(--text-primary)]`}
          style={{ fontFamily: "var(--font-display), serif" }}
        >
          {title}
        </h4>
      ) : null}
      <p className="mt-1.5 flex-1 text-[14px] text-[var(--text-secondary)] leading-snug">{description}</p>
      <p className="mt-3.5 text-[13px] text-[var(--primary)] group-hover:underline">{footer}</p>
    </Link>
  );
}
