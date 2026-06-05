'use client'

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, AlertTriangle, LibraryBig, Volume2, Waves } from "lucide-react";
import Button from "@/components/ui/Button";
import Anchor from "@/components/ui/Anchor";
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
  const atRisk = wordPreview.filter((w) => getWordStrength(w) === "weak");
  const totalDue = dueCount + soundPreview.length;

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

  // ── Overlay: sesión activa ──────────────────────────────────────────────────
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

  // ── Card normal ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <LibraryBig size={18} className="shrink-0 text-[var(--primary)]" />
          <h3
            className="text-xl font-semibold tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-display), serif" }}
          >
            <span className="text-[var(--primary)]">{totalDue}</span> items ready to review
          </h3>
        </div>
        <Anchor
          href="/daily"
          icon={<ArrowRight size={14} />}
          iconPosition="right"
          className="shrink-0 text-caption"
        >
          View daily
        </Anchor>
      </div>

      <p className="text-xs text-[var(--text-tertiary)]">
        Due today · {dueCount} word{dueCount !== 1 ? "s" : ""}
        {soundPreview.length > 0
          ? ` · ${soundPreview.length} sound${soundPreview.length !== 1 ? "s" : ""}`
          : ""}
      </p>

      {atRisk.length > 0 ? (
        <div
          className="mt-3 flex items-start gap-2.5 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-[14px]"
          style={{
            background: "var(--warning-soft)",
            borderColor: "color-mix(in oklch, var(--warning) 30%, transparent)",
          }}
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <span>
            <b className="font-semibold text-[var(--warning-value)]">
              {atRisk.length} word{atRisk.length !== 1 ? "s" : ""}
            </b>{" "}
            are at risk of being forgotten. Review them today.
          </span>
        </div>
      ) : null}

      {/* Words */}
      {wordPreview.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            <Volume2 size={11} />
            Words
          </p>
          <div className="flex flex-col">
            {wordPreview.map((w, idx) => {
              const ipa = formatIpa(w.ipa);
              return (
                <div
                  key={w.id}
                  className={[
                    "flex items-center gap-3 py-2.5",
                    idx < wordPreview.length - 1 ? "border-b border-border-subtle" : "",
                  ].join(" ")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight text-[var(--text-primary)]">
                      <span style={{ fontFamily: "var(--font-display), serif" }}>{w.text}</span>
                      {ipa ? (
                        <small className="ml-2 font-ipa text-[13px] font-normal text-[var(--primary)]">
                          {ipa}
                        </small>
                      ) : null}
                    </p>
                    {w.translation ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--text-tertiary)]">
                        {w.translation}
                      </p>
                    ) : null}
                  </div>
                  <WordStrengthBars strength={getWordStrength(w)} size={14} />
                </div>
              );
            })}
          </div>
        </div>
      ) : dueCount === 0 && soundPreview.length === 0 ? (
        <div className="my-3">
          <p className="py-2 text-sm text-[var(--text-tertiary)]">
            No items due yet — check back later.
          </p>
        </div>
      ) : null}

      {/* Sounds */}
      {soundPreview.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
            <Waves size={11} />
            Sounds
          </p>
          <div className="flex flex-col">
            {soundPreview.map((s, idx) => (
              <div
                key={s.soundId}
                className={[
                  "flex items-center gap-3 py-2.5",
                  idx < soundPreview.length - 1 ? "border-b border-border-subtle" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight text-[var(--text-primary)]">
                    <span className="font-ipa text-[var(--primary)]">{formatIpa(s.ipa)}</span>
                    {s.example ? (
                      <small className="ml-2 font-normal text-[var(--text-secondary)]">
                        {s.example}
                      </small>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {s.accuracy}% accuracy
                    {s.daysOverdue > 0 ? ` · ${s.daysOverdue}d overdue` : " · due today"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {dueCount > WORDS_PREVIEW_LIMIT ? (
        <p className="mb-2 mt-1 text-center text-xs text-[var(--text-tertiary)]">
          +{dueCount - WORDS_PREVIEW_LIMIT} more words in vocabulary
        </p>
      ) : null}

      {reviewState.phase === "done" ? (
        <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-3 text-center text-sm text-[var(--text-secondary)]">
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
          className="mt-3 justify-center"
          disabled={totalDue === 0 || reviewState.phase === "loading"}
          onClick={handleStartReview}
        >
          {reviewState.phase === "loading" ? "Preparing…" : "Start review"}
        </Button>
      )}

      {reviewState.phase === "error" ? (
        <p className="mt-2 text-center text-xs text-[var(--error)]">
          Couldn't load the review. Try again.
        </p>
      ) : null}
    </div>
  );
}
