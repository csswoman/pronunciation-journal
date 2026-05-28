"use client";

import { BookOpen, BookMarked, Layers } from "lucide-react";

export const WORDS_TABS = [
  { id: "lexicon",   label: "Lexicon",   icon: BookOpen },
  { id: "my-words",  label: "My Words",  icon: BookMarked },
  { id: "decks",     label: "Decks",     icon: Layers },
] as const;

export type WordsTabId = (typeof WORDS_TABS)[number]["id"];

interface WordsTabsProps {
  active: WordsTabId;
  onChange: (id: WordsTabId) => void;
}

export default function WordsTabs({ active, onChange }: WordsTabsProps) {
  return (
    <div className="flex w-full border-b border-border-default">
      {WORDS_TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm -mb-px border-b-2 transition-colors whitespace-nowrap cursor-pointer bg-transparent ${
              isActive
                ? "font-semibold text-fg border-primary"
                : "font-normal text-fg-muted border-transparent"
            }`}
          >
            <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
