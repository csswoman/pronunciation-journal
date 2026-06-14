"use client";

import { Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import type { WordsTabId } from "@/components/words/WordsTopbar";

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
  wordsLoading,
  onAddWord,
  onAddDeck,
}: WordsHeroProps) {
  const isWords = activeTab === "my-words";

  const stat = isWords
    ? `${myWordsCount} ${myWordsCount === 1 ? "word" : "words"} in your collection`
    : `${deckCount} ${deckCount === 1 ? "deck" : "decks"}`;

  return (
    <div className="words-lexicon__contextbar">
      <p className="words-lexicon__contextbar-stat">
        {wordsLoading ? (
          <span className="words-lexicon__contextbar-skel" aria-hidden />
        ) : (
          stat
        )}
      </p>

      {isWords ? (
        <Button onClick={onAddWord} icon={<Plus size={15} />} size="sm">
          New Word
        </Button>
      ) : (
        <Button onClick={onAddDeck} icon={<Plus size={15} />} size="sm">
          New Deck
        </Button>
      )}
    </div>
  );
}
