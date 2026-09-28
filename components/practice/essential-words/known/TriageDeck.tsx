"use client";

// Planned structure:
// <TriageDeck>
//   <TriageCardStack>
//     <NextCardPeek />
//     <TriageCard />
//   </TriageCardStack>
//   <TriageActionHints />
// </TriageDeck>

import { useSwipeCard } from "@/hooks/useSwipeCard";
import { TriageCard } from "./TriageCard";
import { TriageActionHints } from "./TriageActionHints";
import type { EssentialWord } from "@/lib/essential-words/types";

interface TriageDeckProps {
  currentWord: EssentialWord;
  nextWord?: EssentialWord;
  onKnown: () => Promise<void> | void;
  onSkip: () => void;
  onUndo?: () => Promise<void> | void;
  canUndo?: boolean;
  disabled?: boolean;
}

export function TriageDeck({
  currentWord,
  nextWord,
  onKnown,
  onSkip,
  onUndo,
  canUndo = false,
  disabled = false,
}: TriageDeckProps) {
  const { offset, bind, triggerSwipe, isExiting } = useSwipeCard({
    onSwipeLeft: onKnown,
    onSwipeRight: onSkip,
    disabled,
  });

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Card stack container */}
      <div className="relative w-full flex items-center justify-center min-h-[420px]">
        {/* Next card preview underneath */}
        {nextWord && !isExiting && (
          <div
            aria-hidden
            className="absolute inset-0 max-w-sm sm:max-w-md min-h-[380px] p-6 sm:p-8 rounded-3xl bg-surface-raised/70 border border-border-subtle mx-auto scale-95 translate-y-3 opacity-60 pointer-events-none transition-transform motion-reduce:transition-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-fg-subtle">{nextWord.cefr_level}</span>
              <span className="text-xs font-mono text-fg-subtle">#{nextWord.rank}</span>
            </div>
            <div className="flex flex-col items-center justify-center my-8">
              <span className="text-3xl font-bold text-fg-muted/50">{nextWord.word}</span>
            </div>
          </div>
        )}

        {/* Current active card */}
        <TriageCard word={currentWord} offset={offset} bind={bind} />
      </div>

      {/* Action buttons and keyboard hints */}
      <TriageActionHints
        onKnown={() => triggerSwipe("left")}
        onSkip={() => triggerSwipe("right")}
        onUndo={onUndo}
        canUndo={canUndo}
        disabled={disabled || isExiting !== null}
      />
    </div>
  );
}
