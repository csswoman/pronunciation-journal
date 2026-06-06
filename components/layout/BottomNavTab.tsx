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
    "relative flex min-h-11 min-w-[3.25rem] flex-col items-center justify-end gap-0.5 rounded-[var(--radius-sm)] px-2 pb-1 pt-1.5",
    "text-xs font-medium leading-tight tracking-wide",
    "transition-colors duration-[var(--transition-fast)]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]",
    active
      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
      : "text-fg-subtle hover:bg-[var(--btn-hover-bg)] hover:text-fg",
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
          "flex h-5 w-5 items-center justify-center transition-colors duration-[var(--transition-fast)]",
          active ? "text-[var(--primary)]" : "text-current",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span>{name}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={tabClass(active)}
        aria-current={active ? "page" : undefined}
      >
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
