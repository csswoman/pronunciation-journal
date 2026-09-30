"use client";

// Planned structure:
// <SessionReadyTriageCard>
//   <TriageCardIcon />
//   <TriageCardContent />
//   <TriageCardChevron />
// </SessionReadyTriageCard>

import Link from "next/link";
import { Sparkles, ChevronRight } from "@/components/icons";

export function SessionReadyTriageCard() {
  return (
    <Link
      href="/practice/essential-words/known"
      className="group flex w-full flex-col gap-2 rounded-3xl border border-border-default bg-surface-raised hover:bg-surface-sunken p-5 text-left text-fg transition-all duration-150 motion-reduce:transition-none hover:border-border-muted cursor-pointer animate-home-in motion-reduce:animate-none"
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-info/15 text-info p-2.5"
          aria-hidden
        >
          <Sparkles size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-base text-fg">
            ¿Ya conoces palabras?
          </span>
          <span className="block text-xs sm:text-sm text-fg-muted">
            Triage rápido por nivel para no repetirlas
          </span>
        </span>
        <ChevronRight
          size={18}
          className="shrink-0 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5"
          aria-hidden
        />
      </div>
    </Link>
  );
}
