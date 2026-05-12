"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import type { VocabTabId } from "@/components/vocabulary/VocabTabs";

interface WordStats {
  total: number;
  strength: { weak: number; medium: number; strong: number };
}

interface VocabularyHeroProps {
  activeTab: VocabTabId;
  wordStats: WordStats;
  deckCount: number;
  wordsLoading: boolean;
  onAddWord: () => void;
  onAddDeck: () => void;
}

export function VocabularyHero({
  activeTab,
  wordStats,
  deckCount,
  wordsLoading,
  onAddWord,
  onAddDeck,
}: VocabularyHeroProps) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mb-6 bg-gradient-to-br from-surface-raised to-surface-sunken"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--primary)] opacity-60 mb-0.5">
            Vocabulary
          </p>
          <h1 className="text-2xl font-bold leading-[1.15] text-fg mb-4">
            {activeTab === "words" ? "Word Bank" : "Decks"}
          </h1>

          {activeTab === "words" && !wordsLoading && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[12px] text-fg-subtle">
                <span className="font-semibold text-fg">{wordStats.total}</span>{" "}
                {wordStats.total === 1 ? "word" : "words"}
              </span>
              {wordStats.total > 0 && (
                <>
                  <span className="text-fg-subtle opacity-40 text-[12px]">·</span>
                  {(
                    [
                      { label: "Weak",   count: wordStats.strength.weak,   bg: "color-mix(in oklch, var(--error) 14%, transparent)",   color: "var(--error)" },
                      { label: "Medium", count: wordStats.strength.medium, bg: "color-mix(in oklch, var(--warning) 14%, transparent)", color: "var(--warning)" },
                      { label: "Strong", count: wordStats.strength.strong, bg: "color-mix(in oklch, var(--success) 14%, transparent)", color: "var(--success)" },
                    ] as const
                  ).map(({ label, count, bg, color }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tabular-nums"
                      style={{ background: bg, color }}
                    >
                      <span>{count}</span>
                      <span className="font-normal opacity-80">{label}</span>
                    </span>
                  ))}
                </>
              )}
            </div>
          )}

          {activeTab === "decks" && (
            <p className="mt-1.5 text-[12px] text-fg-subtle">
              {deckCount} {deckCount === 1 ? "deck" : "decks"}
            </p>
          )}
        </div>

        {activeTab === "words" ? (
          <Button onClick={onAddWord} icon={<Plus size={15} />} size="sm">New Word</Button>
        ) : (
          <Button onClick={onAddDeck} icon={<Plus size={15} />} size="sm">New Deck</Button>
        )}
      </div>
    </div>
  );
}
