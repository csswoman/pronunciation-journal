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
      <p className="text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
        Heard: &ldquo;{scoringResult.transcript}&rdquo;
      </p>
      <div className="flex gap-4 justify-center">
        <Button
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-medium transition-colors"
          style={{ backgroundColor: 'var(--btn-regular-bg)', color: 'var(--text-primary)' }}
        >
          🔄 Retry
        </Button>
        <Button
          onClick={onNext}
          className="px-6 py-3 rounded-xl text-white font-medium transition-colors"
          style={{ backgroundColor: 'var(--primary)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--btn-regular-bg-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--primary)')}
        >
          {currentIndex + 1 < totalWords ? "➡️ Next" : "🎉 Finish"}
        </Button>
      </div>
    </div>
  );
}

