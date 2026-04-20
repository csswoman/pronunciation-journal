"use client";

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

  return (
    <div
      className="w-full max-w-sm rounded-2xl px-5 py-4 space-y-3"
      style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--line-divider)" }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-tertiary)" }}>
        Let&apos;s fix one thing
      </p>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Try{" "}
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
              &ldquo;{focus.word}&rdquo;
            </span>
            {" → "}
            <span className="font-mono font-semibold" style={{ color: "var(--primary)" }}>
              /{focus.ipa}/
            </span>
          </p>
          {focusTip && (
            <p className="mt-1 text-xs leading-snug" style={{ color: "var(--text-tertiary)" }}>
              💡 {focusTip}
            </p>
          )}
        </div>

        <button
          onClick={() => onSave(focus.word)}
          disabled={isSaved}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all disabled:opacity-60"
          style={{
            backgroundColor: isSaved ? "var(--btn-regular-bg)" : "var(--primary)",
            color: isSaved ? "var(--text-tertiary)" : "var(--primary-fg, #fff)",
          }}
        >
          {isSaved ? <><Check size={11} /> Saved</> : <><BookmarkPlus size={11} /> Practice later</>}
        </button>
      </div>

      {focusProgress && focusProgress.total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-tertiary)" }}>
              /{focus.ipa}/ this session
            </p>
            <p className="text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
              {focusPct}%
            </p>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--btn-regular-bg)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${focusPct}%`,
                backgroundColor:
                  (focusPct ?? 0) >= 80 ? "#22c55e" :
                  (focusPct ?? 0) >= 50 ? "var(--primary)" : "#f97316",
              }}
            />
          </div>
          <p className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            {focusProgress.correct} correct out of {focusProgress.total} attempts
          </p>
        </div>
      )}
    </div>
  );
}
