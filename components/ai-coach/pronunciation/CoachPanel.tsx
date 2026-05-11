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
  onSave: (word: string) => void;
}

export default function CoachPanel({
  focus,
  focusTip,
  focusProgress,
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

  const attempts = (focusProgress?.total ?? 0);

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--line-divider)",
        borderLeft: "3px solid var(--primary)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-tertiary)" }}>
            Let&apos;s fix one thing
          </p>
          <div
            className="text-lg font-medium leading-snug"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.01em", color: "var(--fg)" }}
          >
            <span>&ldquo;{focus.word}&rdquo;</span>
            <span className="mx-1.5" style={{ color: "var(--text-tertiary)" }}>→</span>
            <span
              className="font-mono font-medium rounded px-2 py-0.5 text-base"
              style={{
                color: "var(--primary)",
                backgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
              }}
            >
              /{focus.ipa}/
            </span>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <IconBtn title="Listen to this sound">
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
        <div
          className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 mt-2 text-sm leading-relaxed"
          style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
        >
          <Lightbulb size={14} className="shrink-0 mt-px" style={{ color: "var(--warning)" }} />
          <span>{focusTip}</span>
        </div>
      )}

      {/* Stats footer */}
      {focusProgress && focusProgress.total > 0 && (
        <div
          className="flex items-center justify-between mt-3 pt-3 text-xs"
          style={{ borderTop: "1px solid var(--line-divider)", color: "var(--text-tertiary)" }}
        >
          <span className="tabular-nums">
            {attempts} attempt{attempts !== 1 ? "s" : ""} this session
          </span>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: "var(--btn-regular-bg)", color: "var(--text-secondary)" }}
          >
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
      className="w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer border-none disabled:cursor-default"
      style={{ color: "var(--text-tertiary)", backgroundColor: "transparent" }}
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.style.backgroundColor = "var(--btn-regular-bg)";
          e.currentTarget.style.color = "var(--fg)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "var(--text-tertiary)";
      }}
    >
      {children}
    </button>
  );
}
