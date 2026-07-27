"use client";

import { useState } from "react";
import { Volume2, BookmarkPlus, Check, Circle, Lightbulb } from "@/components/icons";
import { RemediationSequence } from '@/components/pronunciation-feedback/RemediationSequence'
import { isActionablePronunciationFeedbackCopyEnabled } from '@/lib/pronunciation/feedback/copy-flag'

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
  onSlow?: (word: string) => void;
  onSave: (word: string) => void;
  onRetry?: () => void;
}

export default function CoachPanel({
  focus,
  focusTip,
  focusProgress,
  savedWords,
  onListen,
  onSlow,
  onSave,
  onRetry,
}: CoachPanelProps) {
  const isSaved = savedWords.has(focus.word.toLowerCase());
  const [justSaved, setJustSaved] = useState(false);
  const feedbackCopyEnabled = isActionablePronunciationFeedbackCopyEnabled();

  const handleSave = () => {
    if (isSaved) return;
    onSave(focus.word);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const attempts = (focusProgress?.total ?? 0);

  return (
    <div className="rounded-xl border border-(--line-divider) bg-(--card-bg) p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-body-sm mb-1.5 font-medium text-fg-subtle">
            {feedbackCopyEnabled ? "Let's fix one thing" : "Next practice"}
          </p>
          {feedbackCopyEnabled ? (
            <div className="text-body-lg font-medium leading-snug tracking-[-0.01em] text-(--fg)">
              <span>&ldquo;{focus.word}&rdquo;</span>
              <span className="mx-1.5 text-fg-subtle">→</span>
              <span className="rounded bg-[color-mix(in_oklch,var(--primary)_12%,transparent)] px-2 py-0.5 font-mono text-base font-medium text-primary">
                /{focus.ipa}/
              </span>
            </div>
          ) : (
            <div className="text-body-lg font-medium leading-snug tracking-[-0.01em] text-(--fg)">
              &ldquo;{focus.word}&rdquo;
            </div>
          )}
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
      {feedbackCopyEnabled && focusTip && (
        <div className="mt-2 flex items-start gap-2.5 rounded-lg bg-(--btn-regular-bg) px-3 py-2.5 text-body-sm leading-relaxed text-fg-muted">
          <Lightbulb size={14} className="mt-px shrink-0 text-warning" />
          <span>{focusTip}</span>
        </div>
      )}

      <div className="mt-3">
        <RemediationSequence
          cue={feedbackCopyEnabled ? (focusTip ?? undefined) : undefined}
          onListen={() => onListen(focus.word)}
          onSlow={() => (onSlow ?? onListen)(focus.word)}
          onRetry={onRetry ?? (() => undefined)}
          compact
        />
      </div>

      {/* Stats footer */}
      {focusProgress && focusProgress.total > 0 && (
        <div className="mt-3 flex items-center justify-between border-t border-(--line-divider) pt-3 text-caption text-fg-subtle">
          <span className="tabular-nums">
            {attempts} attempt{attempts !== 1 ? "s" : ""} this session
          </span>
          {feedbackCopyEnabled && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--btn-regular-bg) px-2.5 py-0.5 font-medium text-fg-muted">
              <Circle size={8} fill="currentColor" />
              /{focus.ipa}/ in focus
            </span>
          )}
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
      className="flex h-7 w-7 items-center justify-center rounded-md border-none text-fg-subtle transition-colors hover:bg-(--btn-regular-bg) hover:text-(--fg) cursor-pointer disabled:cursor-default disabled:bg-transparent disabled:text-fg-subtle"
      onMouseEnter={e => {
        if (!disabled) {
          e.currentTarget.classList.add("bg-(--btn-regular-bg)", "text-(--fg)");
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.classList.remove("bg-(--btn-regular-bg)", "text-(--fg)");
      }}
    >
      {children}
    </button>
  );
}
