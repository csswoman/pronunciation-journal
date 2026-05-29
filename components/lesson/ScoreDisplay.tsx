"use client";

import type { WordAttempt } from "@/hooks/useLesson";
import WordAttemptRow from "./WordAttemptRow";
import { H3, H4 } from "@/components/ui/Typography";

interface ScoreDisplayProps {
  wordAttempts: WordAttempt[];
  sessionAccuracy: number;
  totalXP: number;
  totalWords: number;
}

export default function ScoreDisplay({
  wordAttempts,
  sessionAccuracy,
  totalXP,
  totalWords,
}: ScoreDisplayProps) {
  const accuracyLevel = sessionAccuracy >= 85 ? "excellent" : sessionAccuracy >= 60 ? "acceptable" : "poor";
  const accuracyColor = {
    excellent: "text-success",
    acceptable: "text-warning",
    poor: "text-error",
  }[accuracyLevel];
  const accuracyBg = {
    excellent: "bg-success-soft",
    acceptable: "bg-warning-soft",
    poor: "bg-error-soft",
  }[accuracyLevel];
  const accuracyLabel = {
    excellent: "Excellent",
    acceptable: "Keep practicing",
    poor: "Try again",
  }[accuracyLevel];

  return (
    <div className="w-full rounded-2xl border border-border-subtle bg-surface-raised p-6 space-y-6">
      <div className="text-center space-y-3">
        <H3 className="text-h3 text-fg">Lesson Complete</H3>
        <div className={`inline-flex flex-col items-center gap-2 rounded-xl ${accuracyBg} px-6 py-4`}>
          <p className={`text-4xl font-bold ${accuracyColor}`}>
            {sessionAccuracy}%
          </p>
          <p className="text-sm font-medium text-fg-muted">{accuracyLabel}</p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-surface-sunken p-4">
          <p className="text-xs text-fg-muted uppercase tracking-wide mb-1">Words Completed</p>
          <p className="text-2xl font-semibold text-fg">{wordAttempts.length}/{totalWords}</p>
        </div>
        <div className="rounded-lg bg-surface-sunken p-4">
          <p className="text-xs text-fg-muted uppercase tracking-wide mb-1">Rewards Earned</p>
          <p className="text-2xl font-semibold text-success">+{totalXP} XP</p>
        </div>
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-3">
        <H4 className="text-sm font-semibold text-fg">Word-by-Word Feedback</H4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {wordAttempts.map((wa) => (
            <WordAttemptRow key={wa.word} wordAttempt={wa} />
          ))}
        </div>
      </div>
    </div>
  );
}
