"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import type { WordsTabId } from "@/components/words/WordsTabs";

interface WordsHeroProps {
  activeTab: WordsTabId;
  myWordsCount: number;
  deckCount: number;
  lexiconLearned: number;
  lexiconTotal: number;
  wordsLoading: boolean;
  onAddWord: () => void;
  onAddDeck: () => void;
}

export function WordsHero({
  activeTab,
  myWordsCount,
  deckCount,
  lexiconLearned,
  lexiconTotal,
  wordsLoading,
  onAddWord,
  onAddDeck,
}: WordsHeroProps) {
  const titles: Record<WordsTabId, string> = {
    lexicon: "Lexicon",
    "my-words": "My Words",
    decks: "Decks",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br from-surface-raised to-surface-sunken">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] opacity-60 mb-0.5">
            Words
          </p>
          <h1 className="text-2xl font-bold leading-[1.15] text-fg mb-4">
            {titles[activeTab]}
          </h1>

          {!wordsLoading && (
            <div className="mt-2 flex items-center gap-3 flex-wrap text-[12px] text-fg-subtle">
              <span>
                <span className="font-semibold text-fg">{lexiconLearned}</span>
                {" / "}
                <span>{lexiconTotal}</span>
                {" Lexicon learned"}
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-semibold text-fg">{myWordsCount}</span>
                {" My Words"}
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="font-semibold text-fg">{deckCount}</span>
                {" Decks"}
              </span>
            </div>
          )}
        </div>

        {activeTab === "my-words" && (
          <Button onClick={onAddWord} icon={<Plus size={15} />} size="sm">New Word</Button>
        )}
        {activeTab === "decks" && (
          <Button onClick={onAddDeck} icon={<Plus size={15} />} size="sm">New Deck</Button>
        )}
      </div>
    </div>
  );
}
