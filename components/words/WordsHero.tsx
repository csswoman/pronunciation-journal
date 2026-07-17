"use client";

import type { WordsTabId } from "@/components/words/WordsTopbar";

interface WordsHeroProps {
  activeTab: WordsTabId;
  myWordsCount: number;
  deckCount: number;
  wordsLoading: boolean;
}

export function WordsHero({
  activeTab,
  myWordsCount,
  deckCount,
  wordsLoading,
}: WordsHeroProps) {
  const isWords = activeTab === "my-words";

  const stat = isWords
    ? `${myWordsCount} ${myWordsCount === 1 ? "palabra" : "palabras"} en tu colección`
    : `${deckCount} ${deckCount === 1 ? "mazo" : "mazos"}`;

  return (
    <div className="words-lexicon__contextbar">
      <p className="words-lexicon__contextbar-stat">
        {wordsLoading ? (
          <span className="words-lexicon__contextbar-skel" aria-hidden />
        ) : (
          stat
        )}
      </p>
    </div>
  );
}
