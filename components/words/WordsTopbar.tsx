"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export type WordsMode = "dictionary" | "learn";
/** Retained for the legacy runtime behind the server-side /tracking redirect. */
export type WordsTabId = "lexicon" | "my-words";

// Subcomponent structure:
// <WordsTopbar>
//   <nav (Segmented Control Container)>
//     <Link (Segment: Diccionario)>
//     <Link (Segment: Aprender)>
//   </nav>
// </WordsTopbar>

const TABS: { id: WordsMode; label: string }[] = [
  { id: "dictionary", label: "Explorar" },
  { id: "learn", label: "Aprender" },
];

interface WordsTopbarProps {
  activeMode: WordsMode;
  lexiconCount: number;
}

export function WordsTopbar({
  activeMode,
  lexiconCount,
}: WordsTopbarProps) {
  return (
    <nav
      className="inline-flex items-center gap-1.5 p-1 rounded-full bg-surface-raised border border-border-subtle/80 shrink-0 shadow-xs"
      aria-label="Secciones de vocabulario"
    >
      {TABS.map(({ id, label }) => {
        const isActive = activeMode === id;
        const href = id === "learn" ? "/words?mode=learn" : "/words";
        return (
          <Link
            key={id}
            href={href}
            aria-label={id === "dictionary" ? `${label} (${lexiconCount} palabras)` : label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center min-h-[38px] px-5 py-2 rounded-full text-body-sm font-semibold transition-all duration-150 select-none focus-ring",
              isActive
                ? "bg-primary text-on-primary shadow-xs"
                : "text-fg-muted hover:text-fg hover:bg-surface-sunken/60"
            )}
          >
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

