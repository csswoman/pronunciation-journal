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
  lexiconPercentage?: number;
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
  lexiconPercentage = 0,
  wordsLoading,
  onAddWord,
  onAddDeck,
}: WordsHeroProps) {
  const titles: Record<WordsTabId, string> = {
    lexicon: "Lexicon",
    "my-words": "My Words",
    decks: "Decks",
  };

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (lexiconPercentage / 100) * circumference;

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

        <div className="flex items-center gap-4 flex-shrink-0">
          {activeTab === "lexicon" && (
            <>
              <div className="text-right">
                <p className="text-2xl font-bold text-fg tabular-nums">
                  {lexiconLearned.toLocaleString()}
                  <span className="text-fg-muted font-normal text-base"> / {lexiconTotal.toLocaleString()}</span>
                </p>
                <p className="text-xs text-fg-muted mt-0.5">words learned</p>
              </div>

              <div className="relative w-16 h-16 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-sm font-bold text-fg leading-none">{lexiconPercentage.toFixed(0)}%</p>
                </div>
              </div>
            </>
          )}

          {activeTab === "my-words" && (
            <Button onClick={onAddWord} icon={<Plus size={15} />} size="sm">New Word</Button>
          )}
          {activeTab === "decks" && (
            <Button onClick={onAddDeck} icon={<Plus size={15} />} size="sm">New Deck</Button>
          )}
        </div>
      </div>
    </div>
  );
}
