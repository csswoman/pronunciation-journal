"use client";

import { BookMarked, BookOpen } from "@/components/icons";
import Link from "next/link";

export type WordsMode = "dictionary" | "learn" | "saved";
/** Retained for the legacy runtime behind the server-side /tracking redirect. */
export type WordsTabId = "lexicon" | "my-words";

const TABS: { id: WordsMode; label: string; icon: typeof BookOpen }[] = [
  { id: "dictionary", label: "Diccionario", icon: BookOpen },
  { id: "learn", label: "Aprender", icon: BookOpen },
  { id: "saved", label: "Guardadas", icon: BookMarked },
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
    <div className="words-lexicon__topbar flex flex-wrap items-center justify-end gap-3">
      <nav className="words-lexicon__seg flex gap-1 p-1 rounded-full" aria-label="Secciones de vocabulario">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeMode === id;
          const href =
            id === "learn"
              ? "/dictionary?mode=learn"
              : id === "saved"
              ? "/dictionary?mode=saved"
              : "/dictionary";
          return (
            <Link
              key={id}
              href={href}
              aria-label={id === "dictionary" ? `${label} (${lexiconCount} palabras)` : label}
              aria-current={isActive ? "page" : undefined}
              className={`words-lexicon__seg-btn${isActive ? " is-active" : ""}`}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

