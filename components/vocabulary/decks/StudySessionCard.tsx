"use client";

import { H2 } from "@/components/ui/Typography";
import { blankOutWord, speakWord } from "./study-utils";
import type { StudyCardData } from "@/lib/decks/study-source";

// Planned structure:
// <StudySessionCard>
//   <CardFace front />   — word + IPA + blank prompt
//   <CardFace back />    — word + IPA + definition + example
// </StudySessionCard>

interface StudySessionCardProps {
  card: StudyCardData;
  flipped: boolean;
  onFlip: () => void;
  onSkip: () => void;
}

export function StudySessionCard({ card, flipped, onFlip, onSkip }: StudySessionCardProps) {
  return (
    <button
      type="button"
      className="w-full max-w-sm cursor-pointer select-none text-left"
      style={{ perspective: "1000px" }}
      onClick={onFlip}
      aria-label={flipped ? "Flip card to front" : "Flip card to see answer"}
    >
      <div
        className="relative"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: 280,
        }}
      >
        <CardFace onSkip={onSkip}>
          <WordDisplay word={card.front} ipa={card.ipa ?? null} />
          {card.example ? (
            <div className="rounded-xl border border-dashed border-border-subtle p-3 w-full text-left">
              <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">
                Fill in the blank
              </p>
              <p className="text-xs italic leading-relaxed text-fg-muted">
                &ldquo;{blankOutWord(card.example, card.front)}&rdquo;
              </p>
            </div>
          ) : (
            <p className="text-sm italic text-fg-subtle">Think of the meaning before flipping</p>
          )}
        </CardFace>

        <CardFace isBack onSkip={onSkip}>
          <WordDisplay word={card.front} ipa={card.ipa ?? null} />
          <div className="w-full space-y-3 text-left">
            {card.definition && (
              <p className="text-sm leading-snug text-fg">{card.definition}</p>
            )}
            {card.example && (
              <div className="rounded-xl border border-dashed border-border-subtle p-3">
                <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">
                  Example
                </p>
                <p className="text-xs italic leading-relaxed text-fg-muted">
                  &ldquo;{card.example}&rdquo;
                </p>
              </div>
            )}
          </div>
        </CardFace>
      </div>
    </button>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CardFace({
  children,
  isBack = false,
  onSkip,
}: {
  children: React.ReactNode;
  isBack?: boolean;
  onSkip: () => void;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col rounded-2xl border border-border-default bg-[var(--card-bg)] shadow-sm overflow-hidden"
      style={{
        backfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : undefined,
      }}
    >
      <div className="flex items-center justify-end px-4 pt-4 pb-0">
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onSkip(); }}
          title="Skip"
          className="border border-border-subtle rounded-lg px-2 py-1 text-xs text-fg-subtle bg-transparent hover:bg-[var(--btn-regular-bg-hover)] transition-colors cursor-pointer"
        >
          Skip →
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-4">
        {children}
      </div>
    </div>
  );
}

function WordDisplay({ word, ipa }: { word: string; ipa: string | null }) {
  return (
    <>
      <H2
        className="text-5xl font-bold italic leading-none"
        style={{ fontFamily: "var(--font-serif, serif)", color: "var(--text-primary)" }}
      >
        {word}
      </H2>
      {ipa && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-base text-fg-muted">/{ipa}/</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); speakWord(word); }}
            className="border border-border-subtle rounded-lg px-2 py-1 text-xs bg-transparent hover:bg-[var(--btn-regular-bg-hover)] transition-colors cursor-pointer"
          >
            🔊
          </button>
        </div>
      )}
      <div className="w-full border-t border-dashed border-border-subtle" />
    </>
  );
}
