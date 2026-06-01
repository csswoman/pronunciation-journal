"use client";

import { useState } from "react";
import { LessonDetailHeader } from "./LessonDetailHeader";
import { CreateDeckFromWordsModal } from "@/components/vocabulary/decks/CreateDeckFromWordsModal";
import { useDeckData } from "@/hooks/useDeckData";
import { markLexiconWordLearned } from "@/lib/word-bank/queries";
import type { Word } from "./WordGrid";

interface LessonDetailActionsProps {
  title: string;
  blurb: string;
  totalWords: number;
  wordsLearned: number;
  wordsReviewing: number;
  color: string;
  categoryId: string;
  words: Word[];
}

export function LessonDetailActions({
  title,
  blurb,
  totalWords,
  wordsLearned,
  wordsReviewing,
  color,
  categoryId,
  words,
}: LessonDetailActionsProps) {
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [importedIds, setImportedIds] = useState<string[] | null>(null);
  const [importing, setImporting] = useState(false);
  const { addDeck } = useDeckData();

  const handleCreateDeck = async () => {
    setImporting(true);
    const results = await Promise.all(
      words.map((w) =>
        markLexiconWordLearned({
          sourceRef: w.id,
          text: w.word,
          definition: w.definition ?? "",
          example: w.example ?? null,
        })
      )
    );
    setImportedIds(results.map((r) => r.entry.id));
    setImporting(false);
    setShowCreateDeck(true);
  };

  return (
    <>
      <LessonDetailHeader
        title={title}
        blurb={blurb}
        totalWords={totalWords}
        wordsLearned={wordsLearned}
        wordsReviewing={wordsReviewing}
        color={color}
        categoryId={categoryId}
        onCreateDeck={importing ? undefined : handleCreateDeck}
      />
      {showCreateDeck && importedIds && (
        <CreateDeckFromWordsModal
          wordIds={importedIds}
          onClose={() => {
            setShowCreateDeck(false);
            setImportedIds(null);
          }}
          onCreated={(deck) => {
            addDeck(deck);
            setShowCreateDeck(false);
            setImportedIds(null);
          }}
        />
      )}
    </>
  );
}
