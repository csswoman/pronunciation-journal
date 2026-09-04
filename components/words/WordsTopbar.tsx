"use client";

import Link from "next/link";
import { BookOpen, GraduationCap } from "@/components/icons";
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

const TABS: { id: WordsMode; label: string; icon: typeof BookOpen }[] = [
  { id: "dictionary", label: "Diccionario", icon: BookOpen },
  { id: "learn", label: "Aprender", icon: GraduationCap },
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
      className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-sunken border border-border-subtle/80 shrink-0 shadow-inner"
      aria-label="Secciones de vocabulario"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = activeMode === id;
        const href = id === "learn" ? "/words?mode=learn" : "/words";
        return (
          <Link
            key={id}
            href={href}
            aria-label={id === "dictionary" ? `${label} (${lexiconCount} palabras)` : label}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center gap-2 min-h-[42px] sm:min-h-[38px] px-4 py-2 rounded-full text-body-sm font-semibold transition-all duration-150 select-none focus-ring",
              isActive
                ? "bg-surface-raised text-fg shadow-xs border border-border-subtle/80"
                : "text-fg-muted hover:text-fg hover:bg-surface-raised/50"
            )}
          >
            <Icon
              size={16}
              strokeWidth={isActive ? 2 : 1.7}
              className={cn("transition-colors shrink-0", isActive ? "text-primary" : "text-fg-subtle")}
              aria-hidden
            />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

