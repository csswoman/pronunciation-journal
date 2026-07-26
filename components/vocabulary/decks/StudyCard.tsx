"use client";

import { Bookmark, SkipForward, Volume2 } from "@/components/icons";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";
import { blankOutWord, speakWord } from "./study-utils";

interface Meaning {
  partOfSpeech?: string;
  definitions?: { definition?: string; example?: string }[];
}

interface StudyCardProps {
  word: string;
  ipa?: string | null;
  levelLabel: string | null;
  firstMeaning?: Meaning;
  firstDef?: { definition?: string; example?: string };
  flipped: boolean;
  onFlip: () => void;
  onSkip: () => void;
}

export function StudyCard({
  word, ipa, levelLabel, firstMeaning, firstDef, flipped, onFlip, onSkip,
}: StudyCardProps) {
  const partOfSpeech = firstMeaning?.partOfSpeech;

  const headerBadge = partOfSpeech ? (
    <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide"
      style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
      {partOfSpeech}
    </span>
  ) : levelLabel ? (
    <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold"
      style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
      {levelLabel}
    </span>
  ) : <span />;

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onSkip(); }} title="Skip" className="!p-1.5 !rounded-lg">
        <SkipForward size={13} />
      </Button>
      <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()} className="!p-1.5 !rounded-lg">
        <Bookmark size={13} />
      </Button>
    </div>
  );

  const wordDisplay = (
    <>
      <p className="m-0 text-display-word font-bold italic text-balance text-fg">
        {word}
      </p>
      {ipa && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-base text-fg-muted">/{ipa}/</span>
          <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); speakWord(word); }} className="!p-1.5">
            <Volume2 size={13} />
          </Button>
        </div>
      )}
      <div className="w-full border-t border-dashed" style={{ borderColor: "var(--line-divider)" }} />
    </>
  );

  const cardFace = (content: React.ReactNode, isBack = false) => (
    <div
      style={{
        backfaceVisibility: "hidden",
        transform: isBack ? "rotateY(180deg)" : undefined,
        backgroundColor: "var(--card-bg)",
        borderRadius: "16px",
        border: "1px solid var(--line-divider)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        {isBack && partOfSpeech ? (
          <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wide"
            style={{ borderColor: "var(--warning)", backgroundColor: "var(--warning-soft)", color: "var(--warning)" }}>
            {partOfSpeech}
          </span>
        ) : !isBack ? headerBadge : <span />}
        {headerActions}
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center space-y-3">
        {content}
      </div>
    </div>
  );

  return (
    <button
      type="button"
      className="flip-card-perspective w-full max-w-sm cursor-pointer select-none text-left"
      onClick={onFlip}
      aria-label={flipped ? "Flip card to front" : "Flip card to see answer"}
    >
      <div
        className={cn("flip-card-inner", flipped && "flip-card-inner--flipped")}
      >
        {/* Front */}
        {cardFace(
          <>
            {wordDisplay}
            {firstDef?.example ? (
              <div className="rounded-xl border border-dashed p-3 w-full text-left"
                style={{ borderColor: "var(--line-divider)" }}>
                <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">Fill in the blank</p>
                <p className="text-xs italic leading-relaxed text-fg-muted">
                  "{blankOutWord(firstDef.example, word)}"
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-fg-subtle">
                Think of the meaning before flipping
              </p>
            )}
          </>
        )}

        {/* Back */}
        {cardFace(
          <>
            {wordDisplay}
            <div className="w-full space-y-3 text-left">
              {firstDef?.definition && (
                <p className="text-sm leading-snug text-fg">
                  {firstDef.definition}
                </p>
              )}
              {firstDef?.example && (
                <div className="rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line-divider)" }}>
                  <p className="text-tiny font-semibold uppercase tracking-widest mb-1 text-fg-subtle">Example</p>
                  <p className="text-xs italic leading-relaxed text-fg-muted">
                    "{firstDef.example}"
                  </p>
                </div>
              )}
            </div>
          </>,
          true
        )}
      </div>
    </button>
  );
}
