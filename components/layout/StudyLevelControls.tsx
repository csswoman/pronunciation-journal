"use client";

// Planned structure:
// <StudyLevelControls>
//   <ContentLevelSelector />
//   {footer}
// </StudyLevelControls>

import type { ReactNode } from "react";
import { Target } from "@/components/icons";
import { cn } from "@/lib/cn";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";
import ContentLevelSelector from "@/components/ui/ContentLevelSelector";

export function StudyLevelControls({
  level,
  onChange,
  className,
  footer,
}: {
  level: CefrLevel;
  onChange: (next: CefrLevel) => void;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <section className={cn("border-t border-border-subtle py-3", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Target size={15} className="text-fg-subtle" aria-hidden />
        <p className="font-kicker text-fg-muted">Tu nivel</p>
      </div>
      <ContentLevelSelector
        levels={CEFR_LEVELS}
        value={level}
        onChange={onChange}
        ariaLabel="Nivel de estudio"
      />
      {footer}
    </section>
  );
}
