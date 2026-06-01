"use client";

import { useState } from "react";
import { WordBrowser } from "./WordBrowser";
import { markLexiconWordLearned, toggleFavorite } from "@/lib/word-bank/queries";
import type { Word } from "./WordGrid";

interface WordBrowserClientProps {
  words: Word[];
  wordBankMapEntries: Array<[string, { id: string; isFavorite: boolean }]>;
}

export function WordBrowserClient({ words, wordBankMapEntries }: WordBrowserClientProps) {
  const [wordBankMap, setWordBankMap] = useState(
    () => new Map(wordBankMapEntries)
  );

  const handleToggleFavorite = async (wordBankId: string, value: boolean) => {
    try {
      await toggleFavorite(wordBankId, value);
      setWordBankMap((prev) => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (v.id === wordBankId) {
            next.set(k, { ...v, isFavorite: value });
            break;
          }
        }
        return next;
      });
    } catch {
      /* silent */
    }
  };

  const handleAddToMyWords = async (lexiconWord: {
    id: string;
    word: string;
    definition: string;
    example?: string;
  }) => {
    try {
      const { entry } = await markLexiconWordLearned({
        sourceRef: lexiconWord.id,
        text: lexiconWord.word,
        definition: lexiconWord.definition,
        example: lexiconWord.example ?? null,
      });
      setWordBankMap(
        (prev) => new Map(prev).set(lexiconWord.id, { id: entry.id, isFavorite: false })
      );
    } catch {
      /* silent */
    }
  };

  return (
    <WordBrowser
      words={words}
      wordBankMap={wordBankMap}
      onToggleFavorite={handleToggleFavorite}
      onAddToMyWords={handleAddToMyWords}
    />
  );
}
