"use client";

import { useState } from "react";
import { Volume2, BookmarkPlus, Check, Circle, Lightbulb } from "lucide-react";

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
  savedWords: Set<string>;
  onListen: (word: string) => void;
  onSave: (word: string) => void;
}

export default function CoachPanel({
  focus,
  focusTip,
  focusProgress,
  savedWords,
  onListen,
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

  const attempts = (focusProgress?.total ?? 0);

  return (
    <div className="rounded-xl border border-[var(--line-divider)] bg-[var(--card-bg)] p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-body-sm mb-1.5 font-medium text-[var(--text-tertiary)]">
            Let&apos;s fix one thing
          </p>
          <div className="text-lg font-medium leading-snug font-[Georgia,serif] tracking-[-0.01em] text-[var(--fg)]">
            <span>&ldquo;{focus.word}&rdquo;</span>
            <span className="mx-1.5 text-[var(--text-tertiary)]">→</span>
            <span className="rounded bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] px-2 py-0.5 font-mono text-base font-medium text-[var(--primary)]">
              /{focus.ipa}/
            </span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <IconBtn title="Listen to this sound" onClick={() => onListen(focus.word)}>
            <Volume2 size={13} />
          </IconBtn>
          <IconBtn title={isSaved ? "Saved" : "Save for practice"} onClick={handleSave} disabled={isSaved}>
            {isSaved
              ? <Check size={13} className={justSaved ? "animate-bounce" : ""} />
              : <BookmarkPlus size={13} />
            }
          </IconBtn>
        </div>
      </div>

      {/* Tip */}
      {focusTip && (
        <div className="mt-2 flex items-start gap-2.5 rounded-lg bg-[var(--btn-regular-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-secondary)]">
          <Lightbulb size={14} className="mt-px shrink-0 text-[var(--warning)]" />
          <span>{focusTip}</span>
        </div>
      )}

      {/* Stats footer */}
      {focusProgress && focusProgress.total > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-[var(--line-divider)] pt-3 text-xs text-[var(--text-tertiary)]">
          <span className="tabular-nums">
            {attempts} attempt{attempts !== 1 ? "s" : ""} this session
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--btn-regular-bg)] px-2.5 py-0.5 font-medium text-[var(--text-secondary)]">
            <Circle size={8} fill="currentColor" />
            /{focus.ipa}/ in focus
          </span>
        </div>
      )}
    </div>
  );
}

function IconBtn({
  title, onClick, disabled, children,
}: {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md border-none text-[var(--text-tertiary)] transition-colors hover:bg-[var(--btn-regular-bg)] hover:text-[var(--fg)] cursor-pointer disabled:cursor-default disabled:bg-transparent disabled:text-[var(--text-tertiary)]"
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.classList.add("bg-[var(--btn-regular-bg)]", "text-[var(--fg)]");
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.classList.remove("bg-[var(--btn-regular-bg)]", "text-[var(--fg)]");
      }}
    >
      {children}
    </button>
  );
}
