"use client";

import { useState, useEffect } from "react";
import { LexiconFlashcardHeader } from "./LexiconFlashcardHeader";
import { LexiconFlashcardBody } from "./LexiconFlashcardBody";
import { LexiconFlashcardRatingBar } from "./LexiconFlashcardRatingBar";
import { speak } from "@/lib/phoneme-practice/tts";
import type { FlashcardRating } from "@/lib/word-bank/lexicon-review-types";

// Planned structure:
// <LexiconFlashcard>
//   <LexiconFlashcardHeader />     — Floating header bar with 10-segment track & undo
//   <LexiconFlashcardBody />       — Main pastel card (Front & Back views in theme color)
//   <LexiconFlashcardRatingBar />  — Anki rating buttons (salmon, butter, mint)
// </LexiconFlashcard>

interface LexiconFlashcardProps {
  categoryId?: string;
  categoryTitle?: string;
  studyMode?: "receptive" | "productive";
  word: string;
  ipa?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string | null;
  translation?: string;
  cardNumber: number;
  totalCards: number;
  canUndo?: boolean;
  disabled?: boolean;
  onUndo?: () => void;
  onClose?: () => void;
  onRate: (rating: FlashcardRating) => void;
}

export function LexiconFlashcard({
  categoryId = "backend-infra",
  categoryTitle = "Backend e infra",
  studyMode = "receptive",
  word,
  ipa,
  partOfSpeech,
  definition,
  example,
  translation,
  cardNumber,
  totalCards,
  canUndo = false,
  disabled = false,
  onUndo,
  onClose,
  onRate,
}: LexiconFlashcardProps) {
  const [revealed, setRevealed] = useState(false);

  function handleRate(rating: FlashcardRating) {
    if (disabled) return;
    onRate(rating);
  }

  function handlePlayAudio(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const textToSpeak = [word, definition, example ? `For example: ${example}` : ""]
      .filter(Boolean)
      .join(". ");
    speak(textToSpeak, { rate: 0.9 });
  }

  // Keyboard shortcut handler for Anki review (Space to reveal, 1/2/3 to rate, Z to undo)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        disabled
      ) {
        return;
      }

      if ((e.key === "z" || e.key === "Z") && canUndo && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      if (e.code === "Space" || e.code === "Enter") {
        if (!revealed) {
          e.preventDefault();
          setRevealed(true);
        }
      } else if (revealed) {
        if (e.key === "1") {
          e.preventDefault();
          handleRate("forgot");
        } else if (e.key === "2") {
          e.preventDefault();
          handleRate("normal");
        } else if (e.key === "3") {
          e.preventDefault();
          handleRate("known");
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, canUndo, onUndo, disabled]);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 mx-auto">
      <LexiconFlashcardHeader
        categoryId={categoryId}
        categoryTitle={categoryTitle}
        studyMode={studyMode}
        cardNumber={cardNumber}
        totalCards={totalCards}
        canUndo={canUndo}
        disabled={disabled}
        onUndo={onUndo}
        onClose={onClose}
      />

      <LexiconFlashcardBody
        categoryId={categoryId}
        word={word}
        ipa={ipa}
        partOfSpeech={partOfSpeech}
        definition={definition}
        example={example}
        translation={translation}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
        onPlayAudio={handlePlayAudio}
      />

      <LexiconFlashcardRatingBar
        revealed={revealed}
        disabled={disabled}
        onReveal={() => setRevealed(true)}
        onRate={handleRate}
      />
    </div>
  );
}
