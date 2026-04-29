"use client";

import { Bookmark, SkipForward, Volume2 } from "lucide-react";
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
      <button
        onClick={(e) => { e.stopPropagation(); onSkip(); }}
        className="p-1.5 rounded-lg border transition-colors"
        style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
        title="Skip"
      >
        <SkipForward size={13} />
      </button>
      <button
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-lg border transition-colors"
        style={{ borderColor: "var(--line-divider)", color: "var(--text-tertiary)" }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Bookmark size={13} />
      </button>
    </div>
  );

  const wordDisplay = (
    <>
      <h2 className="text-5xl font-bold italic leading-none"
        style={{ fontFamily: "var(--font-serif, serif)", color: "var(--deep-text)" }}>
        {word}
      </h2>
      {ipa && (
        <div className="flex items-center gap-2 justify-center">
          <span className="text-base" style={{ color: "var(--text-secondary)" }}>/{ipa}/</span>
          <button
            onClick={(e) => { e.stopPropagation(); speakWord(word); }}
            className="p-1.5 rounded-full border transition-colors"
            style={{ borderColor: "var(--line-divider)", color: "var(--text-secondary)" }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)")}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <Volume2 size={13} />
          </button>
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
        boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
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
    <div style={{ perspective: "1000px" }} className="w-full max-w-sm cursor-pointer select-none" onClick={onFlip}>
      <div style={{
        transformStyle: "preserve-3d",
        transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        position: "relative",
        minHeight: "280px",
      }}>
        {/* Front */}
        {cardFace(
          <>
            {wordDisplay}
            {firstDef?.example ? (
              <div className="rounded-xl border border-dashed p-3 w-full text-left"
                style={{ borderColor: "var(--line-divider)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-tertiary)" }}>Fill in the blank</p>
                <p className="text-xs italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  "{blankOutWord(firstDef.example, word)}"
                </p>
              </div>
            ) : (
              <p className="text-sm italic" style={{ color: "var(--text-tertiary)" }}>
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
                <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                  {firstDef.definition}
                </p>
              )}
              {firstDef?.example && (
                <div className="rounded-xl border border-dashed p-3" style={{ borderColor: "var(--line-divider)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "var(--text-tertiary)" }}>Example</p>
                  <p className="text-xs italic leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    "{firstDef.example}"
                  </p>
                </div>
              )}
            </div>
          </>,
          true
        )}
      </div>
    </div>
  );
}
