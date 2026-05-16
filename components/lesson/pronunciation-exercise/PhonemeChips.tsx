"use client";

import { RotateCcw } from "lucide-react";
import type { PhonemeResult, PhonemeVariant } from "./exercise-types";

const CHIP_STYLES: Record<PhonemeVariant, string> = {
  correct: "bg-word-correct-bg text-word-correct",
  close:   "bg-score-acceptable-bg text-score-acceptable",
  failed:  "bg-word-incorrect-bg text-word-incorrect",
};

interface Props {
  results: PhonemeResult[];
  coachingLine: string;
  onRetry: () => void;
}

export default function PhonemeChips({ results, coachingLine, onRetry }: Props) {
  return (
    <div className="flex flex-col gap-space-3">
      {/* Chips */}
      <div className="flex gap-space-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`relative flex items-center justify-center w-12 h-10 rounded-md animate-chip-appear ${CHIP_STYLES[r.variant]}`}
            style={{ animationDelay: `${i * 40}ms` }}
            title={r.variant}
          >
            <span className="font-[family-name:var(--font-heading)] text-h4 leading-none">
              {r.phoneme}
            </span>
            {r.variant === "failed" && (
              <RotateCcw
                className="absolute top-0.5 right-0.5 w-2.5 h-2.5 opacity-70"
                aria-hidden
              />
            )}
          </div>
        ))}
      </div>

      {/* Coaching line */}
      <p className="text-body-sm italic text-fg-muted leading-snug max-w-[200px]">
        {coachingLine}
      </p>

      {/* Try again */}
      <button
        onClick={onRetry}
        className="text-body-sm text-primary hover:underline text-left w-fit"
      >
        Try again
      </button>
    </div>
  );
}
