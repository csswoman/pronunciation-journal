"use client";
import Button from "@/components/ui/Button";

import PronunciationFeedback from "./PronunciationFeedback";
import type { ScoringResult } from "@/lib/types";

interface Props {
  scoringResult: ScoringResult;
  feedback: { message: string; emoji: string; color: string };
  xpEarned: number;
  currentIndex: number;
  totalWords: number;
  onRetry: () => void;
  onNext: () => void;
}

export default function FeedbackSection({
  scoringResult,
  feedback,
  xpEarned,
  currentIndex,
  totalWords,
  onRetry,
  onNext,
}: Props) {
  return (
    <div className="w-full space-y-6">
      <PronunciationFeedback
        wordResults={scoringResult.wordResults}
        accuracy={scoringResult.accuracy}
        feedback={feedback}
        xpEarned={xpEarned}
      />
      <p className="text-center text-sm text-fg-subtle">
        Heard: &ldquo;{scoringResult.transcript}&rdquo;
      </p>
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-medium transition-colors bg-surface-sunken text-fg"
        >
          🔄 Retry
        </Button>
        <Button
          onClick={onNext}
          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-medium transition-colors hover:opacity-90"
        >
          {currentIndex + 1 < totalWords ? "➡️ Next" : "🎉 Finish"}
        </Button>
      </div>
    </div>
  );
}

