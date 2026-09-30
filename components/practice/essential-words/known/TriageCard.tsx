"use client";

// Planned structure:
// <TriageCard>
//   <TriageCardBadges />
//   <TriageCardWordRow />
//   <TriageCardDetails />
//   <TriageCardSwipeHints />
// </TriageCard>

import { Volume2 } from "@/components/icons";
import { speakWord } from "@/components/ipa/speak-word";
import Badge from "@/components/ui/Badge";
import type { EssentialWord } from "@/lib/essential-words/types";

interface TriageCardProps {
  word: EssentialWord;
  offset: number;
  bind: {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
}

export function TriageCard({ word, offset, bind }: TriageCardProps) {
  const spanishText =
    word.translation ||
    word.study?.definitionEs ||
    (word.study?.translation && word.study.translation[0]);

  // Opacities for swipe hints based on live drag offset
  // Left drag (negative offset) = Ya la sé
  const knownOpacity = Math.min(1, Math.max(0, -offset - 15) / 50);
  // Right drag (positive offset) = No la sé
  const skipOpacity = Math.min(1, Math.max(0, offset - 15) / 50);

  return (
    <div
      {...bind}
      role="region"
      aria-label={`Palabra: ${word.word}`}
      className="relative flex flex-col justify-between w-full max-w-sm sm:max-w-md min-h-[380px] p-6 sm:p-8 rounded-3xl bg-surface-raised border border-border-default select-none touch-none cursor-grab active:cursor-grabbing transition-colors hover:border-border-muted motion-reduce:transition-none mx-auto overflow-hidden"
    >
      {/* Live Swipe Hint Overlays */}
      <div
        style={{ opacity: knownOpacity }}
        aria-hidden
        className="pointer-events-none absolute top-6 left-6 z-20 px-3.5 py-1.5 rounded-xl border-2 border-success bg-success/20 text-success font-black text-sm uppercase tracking-wider -rotate-12 transition-opacity motion-reduce:transition-none"
      >
        Ya la sé
      </div>

      <div
        style={{ opacity: skipOpacity }}
        aria-hidden
        className="pointer-events-none absolute top-6 right-6 z-20 px-3.5 py-1.5 rounded-xl border-2 border-warning bg-warning/20 text-warning font-black text-sm uppercase tracking-wider rotate-12 transition-opacity motion-reduce:transition-none"
      >
        No la sé
      </div>

      {/* Card Header: Level and Part of Speech */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge label={word.cefr_level} variant="info" size="sm" />
          <span className="text-xs font-mono font-medium text-fg-muted uppercase tracking-wider">
            {word.pos}
          </span>
        </div>
        <span className="text-xs font-mono text-fg-subtle">
          #{word.rank}
        </span>
      </div>

      {/* Card Body: Word, IPA, Pronunciation Button */}
      <div className="flex flex-col items-center justify-center text-center my-6 gap-3">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-fg tracking-tight m-0">
          {word.word}
        </h2>

        <div className="flex items-center gap-2 justify-center">
          <span className="font-ipa text-lg sm:text-xl text-fg-muted">
            {word.ipa_strong}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              speakWord(word.word);
            }}
            aria-label={`Escuchar pronunciación de ${word.word}`}
            className="flex items-center justify-center size-9 rounded-full bg-surface-sunken text-fg-muted hover:text-fg hover:bg-surface-elevated active:scale-95 transition-all motion-reduce:transition-none cursor-pointer border border-border-subtle"
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      {/* Card Footer: Translation, Meaning & Example */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border-subtle text-left">
        {spanishText && (
          <div>
            <span className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-0.5">
              Significado
            </span>
            <p className="text-base sm:text-lg font-medium text-fg m-0">
              {spanishText}
            </p>
          </div>
        )}

        {word.meaning && word.meaning !== spanishText && (
          <p className="text-xs sm:text-sm text-fg-muted italic m-0">
            &ldquo;{word.meaning}&rdquo;
          </p>
        )}

        {word.example_sentence && (
          <div className="mt-1 p-3 rounded-2xl bg-surface-sunken border border-border-subtle">
            <span className="block text-[11px] font-semibold text-fg-subtle uppercase tracking-wider mb-0.5">
              Ejemplo
            </span>
            <p className="text-xs sm:text-sm text-fg m-0">
              {word.example_sentence}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
