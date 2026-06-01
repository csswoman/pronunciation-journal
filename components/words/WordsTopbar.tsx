"use client";

import { BookOpen, BookMarked, Layers } from "lucide-react";
import type { WordsTabId } from "@/components/words/WordsTabs";

const TABS: { id: WordsTabId; label: string; icon: typeof BookOpen }[] = [
  { id: "lexicon", label: "Lexicon", icon: BookOpen },
  { id: "my-words", label: "My Words", icon: BookMarked },
  { id: "decks", label: "Decks", icon: Layers },
];

const TITLES: Record<WordsTabId, string> = {
  lexicon: "Lexicon",
  "my-words": "My Words",
  decks: "Decks",
};

interface WordsTopbarProps {
  activeTab: WordsTabId;
  onTabChange: (tab: WordsTabId) => void;
  lexiconCount: number;
  myWordsCount: number;
  deckCount: number;
}

export function WordsTopbar({
  activeTab,
  onTabChange,
  lexiconCount,
  myWordsCount,
  deckCount,
}: WordsTopbarProps) {
  const counts: Record<WordsTabId, number> = {
    lexicon: lexiconCount,
    "my-words": myWordsCount,
    decks: deckCount,
  };

  return (
    <div className="words-lexicon__topbar flex flex-wrap items-center justify-between gap-5">
      <div>
        <span className="words-lexicon__eyebrow">Vocabulary</span>
        <h1 className="words-lexicon__title">{TITLES[activeTab]}</h1>
      </div>
      <div
        className="words-lexicon__seg flex gap-1 p-1 rounded-full"
        role="tablist"
        aria-label="Words sections"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`words-lexicon__seg-btn${isActive ? " is-active" : ""}`}
              onClick={() => onTabChange(id)}
            >
              <Icon size={15} strokeWidth={isActive ? 2 : 1.6} aria-hidden />
              {label}
              <span className="words-lexicon__seg-count">{counts[id]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
