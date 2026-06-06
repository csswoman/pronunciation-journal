"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface BottomNavTabProps {
  name: string;
  icon: ReactNode;
  active: boolean;
  href?: string;
  onClick?: () => void;
  ariaExpanded?: boolean;
  ariaControls?: string;
}

const tabClass = (active: boolean) =>
  cn(
    "relative flex min-h-11 min-w-[3.25rem] flex-col items-center justify-end gap-0.5 rounded-[var(--radius-sm)] px-2 pb-1 pt-2",
    "transition-colors duration-[var(--transition-fast)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
    active ? "text-[var(--primary)]" : "text-[var(--text-tertiary)] hover:text-fg",
  );

export default function BottomNavTab({
  name,
  icon,
  active,
  href,
  onClick,
  ariaExpanded,
  ariaControls,
}: BottomNavTabProps) {
  const content = (
    <>
      <span
        className={cn(
          "absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[var(--primary)] transition-all duration-[var(--transition-fast)]",
          active ? "w-5 opacity-100" : "w-0 opacity-0",
        )}
        aria-hidden
      />
      <span className="flex h-5 w-5 items-center justify-center" aria-hidden>
        {icon}
      </span>
      <span
        className={cn(
          "text-[0.6875rem] font-medium leading-tight transition-all duration-[var(--transition-fast)]",
          active ? "max-h-4 opacity-100" : "max-h-0 opacity-0 overflow-hidden",
        )}
      >
        {name}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tabClass(active)} aria-current={active ? "page" : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={tabClass(active)}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaControls ? "dialog" : undefined}
    >
      {content}
    </button>
  );
}
