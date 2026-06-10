"use client";

// Planned structure:
// <HomeReviewCarousel>
//   <HomeSectionHeader />
//   <div scroll-container>
//     <WordCard /> × n
//     <SoundCard /> × n
//     <StartReviewCard />   ← or EmptyCard
//   </div>
//   <PracticeSession overlay (when active) />
// </HomeReviewCarousel>

import { useState, useCallback } from "react";
import { Check, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import PracticeSession from "@/components/practice/PracticeSession";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { WordStrengthBars } from "@/components/vocabulary/words/WordStrengthBars";
import { getWordStrength } from "@/lib/word-bank/strength";
import { buildReviewPlan } from "@/lib/practice/daily-plan";
import { useAuth } from "@/components/auth/AuthProvider";
import type { WordBankEntry } from "@/lib/word-bank/types";
import type { SoundDueHome } from "@/lib/home/constants";
import type { DailyStep } from "@/lib/practice/types";

interface HomeReviewCarouselProps {
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

export default function HomeReviewCarousel({
  words = [],
  dueCount = 0,
  soundsDue = [],
}: HomeReviewCarouselProps) {
  const { user } = useAuth();
  const [reviewState, setReviewState] = useState<ReviewState>({ phase: "idle" });
  const [sessionKey, setSessionKey] = useState(0);

  const totalDue = dueCount + soundsDue.length;

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

  const handleExit = useCallback(() => setReviewState({ phase: "idle" }), []);

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

  const nothingDue = totalDue === 0;

  return (
    <section>
      <HomeSectionHeader number="02" title="Due for review" />
      <div className="-mx-4 overflow-x-auto snap-x snap-mandatory px-4">
        <div className="flex gap-3 pb-3">
          {nothingDue ? (
            <div className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col items-center justify-center gap-2 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--success-soft)] text-[var(--success)]">
                <Check size={18} />
              </span>
              <p className="font-body-sm font-medium text-[var(--text-primary)]">All caught up</p>
              <p className="font-caption text-[var(--text-tertiary)]">Come back tomorrow</p>
            </div>
          ) : (
            <>
              {words.map((w) => (
                <div
                  key={w.id}
                  className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4"
                >
                  <div>
                    <p className="font-display text-xl font-semibold leading-tight text-[var(--text-primary)]">
                      {w.text}
                    </p>
                    {w.ipa ? (
                      <p className="font-ipa mt-0.5 text-sm text-[var(--primary)]">{formatIpa(w.ipa)}</p>
                    ) : null}
                  </div>
                  <WordStrengthBars strength={getWordStrength(w)} size={14} />
                </div>
              ))}
              {soundsDue.map((s) => (
                <div
                  key={s.soundId}
                  className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col justify-between gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4"
                >
                  <div>
                    <p className="font-ipa text-3xl font-bold leading-none text-[var(--primary)]">
                      {formatIpa(s.ipa)}
                    </p>
                    {s.example ? (
                      <p className="font-body-sm mt-1 text-[var(--text-secondary)]">{s.example}</p>
                    ) : null}
                  </div>
                  <p className="font-caption text-[var(--text-tertiary)]">
                    {s.accuracy}% · {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : "due today"}
                  </p>
                </div>
              ))}
              <div className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 text-center">
                <p className="type-stat text-2xl">{totalDue}</p>
                <p className="font-body-sm text-[var(--text-secondary)]">
                  {totalDue === 1 ? "item" : "items"} due
                </p>
                {reviewState.phase === "done" ? (
                  <p className="font-body-sm text-[var(--success)]">Review complete!</p>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    icon={reviewState.phase === "loading" ? undefined : <ArrowRight size={14} />}
                    iconPosition="right"
                    disabled={reviewState.phase === "loading"}
                    onClick={handleStartReview}
                  >
                    {reviewState.phase === "loading" ? "Preparing…" : "Start review"}
                  </Button>
                )}
                {reviewState.phase === "error" ? (
                  <p className="font-caption text-[var(--error)]">Couldn&apos;t load the review.</p>
                ) : null}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
