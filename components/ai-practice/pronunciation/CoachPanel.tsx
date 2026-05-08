"use client";

import { useState } from "react";
import { BookmarkPlus, Check } from "lucide-react";

interface FocusPhoneme {
  word: string;
  phoneme: string;
  ipa: string;
}

interface FocusProgress {
  correct: number;
  total: number;
}

interface CoachPanelProps {
  focus: FocusPhoneme;
  focusTip: string | null;
  focusProgress: FocusProgress | null;
  focusPct: number | null;
  savedWords: Set<string>;
  onSave: (word: string) => void;
}

export default function CoachPanel({
  focus,
  focusTip,
  focusProgress,
  focusPct,
  savedWords,
  onSave,
}: CoachPanelProps) {
  const isSaved = savedWords.has(focus.word.toLowerCase());
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    if (isSaved) return;
    onSave(focus.word);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  return (
    <div
      className="py-3 space-y-3 pl-[14px] mx-5"
      style={{ borderLeft: "3px solid var(--primary)" }}
    >
      <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle">
        Let&apos;s fix one thing
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-fg-muted">
            Try{" "}
            <span className="font-semibold text-fg">
              &ldquo;{focus.word}&rdquo;
            </span>
            {" → "}
            <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>
              /{focus.ipa}/
            </span>
          </p>
          {focusTip && (
            <p className="mt-1 text-xs leading-snug text-fg-subtle">
              💡 {focusTip}
            </p>
          )}
        </div>

        {/* Save button — icon only with tooltip */}
        <div className="relative group flex-shrink-0 ml-3">
          <button
            onClick={handleSave}
            disabled={isSaved}
            aria-label="Practice later"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-default"
            style={{
              backgroundColor: isSaved
                ? "var(--btn-regular-bg)"
                : "var(--primary)",
              color: isSaved ? "var(--text-tertiary)" : "var(--on-primary)",
              transform: justSaved ? "scale(1.25)" : "scale(1)",
            }}
          >
            {isSaved
              ? <Check size={13} className={justSaved ? "animate-bounce" : ""} />
              : <BookmarkPlus size={13} />
            }
          </button>

          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full right-0 mb-1.5 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 bg-surface-tooltip text-white/80">
            {isSaved ? "Saved" : "Practice later"}
          </div>
        </div>
      </div>

      {focusProgress && focusProgress.total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-tiny uppercase tracking-widest font-semibold text-fg-subtle">
              /{focus.ipa}/ this session
            </p>
            <p className="text-tiny font-mono text-fg-muted">
              {focusPct}%
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${focusPct}%`,
                backgroundColor:
                  (focusPct ?? 0) >= 80 ? "var(--score-excellent)" :
                  (focusPct ?? 0) >= 50 ? "var(--primary)" : "var(--score-acceptable)",
              }}
            />
          </div>
          <p className="text-tiny text-fg-subtle">
            {focusProgress.correct} correct out of {focusProgress.total} attempts
          </p>
        </div>
      )}
    </div>
  );
}
