'use client'

import { useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import PracticeSession from "@/components/practice/PracticeSession";

import { getWordStrength } from "@/lib/word-bank/strength";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
import { buildReviewPlan } from "@/lib/practice/daily-plan";
import { useAuth } from "@/components/auth/AuthProvider";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";
import type { DailyStep } from "@/lib/practice/types";

const WORDS_PREVIEW_LIMIT = 3;
const SOUNDS_PREVIEW_LIMIT = 3;

interface HomeReviewQueueCardProps {
  words?: WordBankEntry[];
  dueCount?: number;
  soundsDue?: SoundDueHome[];
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return "";
  return ipa.startsWith("/") ? ipa : `/${ipa.replace(/^\/|\/$/g, "")}/`;
}

type ReviewState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error" }
  | { phase: "session"; steps: DailyStep[]; stepIndex: number }
  | { phase: "done" };

export default function HomeReviewQueueCard({
  words = [],
  dueCount = 0,
  soundsDue = [],
}: HomeReviewQueueCardProps) {
  const { user } = useAuth();
  const [reviewState, setReviewState] = useState<ReviewState>({ phase: "idle" });
  const [sessionKey, setSessionKey] = useState(0);

  const wordPreview = words.slice(0, WORDS_PREVIEW_LIMIT);
  const soundPreview = soundsDue.slice(0, SOUNDS_PREVIEW_LIMIT);
  const atRiskCount = wordPreview.filter((w) => getWordStrength(w) === "weak").length;
  const totalDue = dueCount + soundsDue.length;
  const hasPreview = wordPreview.length > 0 || soundPreview.length > 0;
  const hasDue = dueCount > 0 || soundsDue.length > 0;

  const handleStartReview = useCallback(async () => {
    if (!user) return;
    setReviewState({ phase: "loading" });
    try {
      const plan = await buildReviewPlan(user.id);
      if (plan.nothingDue || plan.steps.length === 0) {
        setReviewState({ phase: "done" });
        return;
      }
      setSessionKey((k) => k + 1);
      setReviewState({ phase: "session", steps: plan.steps, stepIndex: 0 });
    } catch {
      setReviewState({ phase: "error" });
    }
  }, [user]);

  const handleStepComplete = useCallback(() => {
    setReviewState((prev) => {
      if (prev.phase !== "session") return prev;
      const next = prev.stepIndex + 1;
      if (next >= prev.steps.length) return { phase: "done" };
      return { phase: "session", steps: prev.steps, stepIndex: next };
    });
  }, []);

  const handleExit = useCallback(() => {
    setReviewState({ phase: "idle" });
  }, []);

  if (reviewState.phase === "session") {
    const step = reviewState.steps[reviewState.stepIndex];
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface-base)]">
        <PracticeSession
          key={`${sessionKey}-${reviewState.stepIndex}`}
          context="daily"
          exercises={step.exercises}
          sessionLength={step.exercises.length}
          sessionLabel={step.title}
          onSessionComplete={handleStepComplete}
          onExit={handleExit}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="type-stat text-2xl">{totalDue}</span>
          <span className="font-body-sm text-[var(--text-secondary)]">
            {totalDue === 1 ? "item" : "items"} due
          </span>
        </div>
        {atRiskCount > 0 ? (
          <span className="font-caption flex items-center gap-1.5 text-[var(--warning)]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--warning)]" aria-hidden />
            {atRiskCount} weakening
          </span>
        ) : null}
      </div>

      {hasDue ? (
        <div className="mt-1 flex gap-3">
          {dueCount > 0 ? (
            <span className="font-caption text-[var(--text-tertiary)]">
              {dueCount} {dueCount === 1 ? "word" : "words"}
            </span>
          ) : null}
          {soundsDue.length > 0 ? (
            <span className="font-caption text-[var(--text-tertiary)]">
              {soundsDue.length} {soundsDue.length === 1 ? "sound" : "sounds"}
            </span>
          ) : null}
        </div>
      ) : (
        <p className="font-body-sm mt-1 text-[var(--text-tertiary)]">
          Nothing due yet — check back later.
        </p>
      )}

      {hasPreview ? (
        <div className="mt-4 flex flex-col gap-3">
          {wordPreview.map((w) => {
            const ipa = formatIpa(w.ipa);
            return (
              <div key={w.id} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-medium leading-tight text-[var(--text-primary)]">
                    {w.text}
                    {ipa ? (
                      <span className="font-ipa ml-2 text-base font-normal text-[var(--primary)]">
                        {ipa}
                      </span>
                    ) : null}
                  </p>
                  {w.translation ? (
                    <p className="font-body-sm mt-0.5 text-[var(--text-tertiary)]">{w.translation}</p>
                  ) : null}
                </div>
                <WordStrengthBars strength={getWordStrength(w)} size={14} />
              </div>
            );
          })}
          {soundPreview.map((s) => (
            <div key={s.soundId} className="min-w-0">
              <p className="font-display text-base font-medium leading-tight text-[var(--text-primary)]">
                <span className="font-ipa text-[var(--primary)]">{formatIpa(s.ipa)}</span>
                {s.example ? (
                  <span className="font-body-sm ml-2 font-normal text-[var(--text-secondary)]">
                    {s.example}
                  </span>
                ) : null}
              </p>
              <p className="font-caption mt-0.5 text-[var(--text-tertiary)]">
                {s.accuracy}% · {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : "due today"}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {dueCount > WORDS_PREVIEW_LIMIT ? (
        <p className="font-caption mt-3 text-[var(--text-tertiary)]">
          +{dueCount - WORDS_PREVIEW_LIMIT} more in vocabulary
        </p>
      ) : null}

      {reviewState.phase === "done" ? (
        <div className="animate-state-in mt-4 rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-2.5 text-center font-body-sm text-[var(--text-secondary)]">
          Review complete! Come back tomorrow.
        </div>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          icon={reviewState.phase === "loading" ? undefined : <ArrowRight size={15} />}
          iconPosition="right"
          className="mt-4 justify-center"
          disabled={totalDue === 0 || reviewState.phase === "loading"}
          onClick={handleStartReview}
        >
          {reviewState.phase === "loading" ? "Preparing…" : "Start review"}
        </Button>
      )}

      {reviewState.phase === "error" ? (
        <div className="animate-state-in mt-2 flex flex-col items-center gap-2">
          <p className="font-caption text-center text-[var(--error)]">Couldn&apos;t load the review.</p>
          <Button type="button" variant="secondary" size="sm" onClick={handleStartReview}>
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  );
}
