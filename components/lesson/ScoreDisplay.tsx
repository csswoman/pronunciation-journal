"use client";

import type { WordAttempt } from "@/hooks/useLesson";
import WordAttemptRow from "./WordAttemptRow";

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
  return (
    <div className="w-full rounded-2xl border p-6" style={{
      backgroundColor: 'var(--card-bg)',
      borderColor: 'var(--line-divider)',
    }}>
      <h3 className="text-xl font-bold mb-4 text-center" style={{
        color: 'var(--text-primary)',
      }}>
        🎉 Lesson Complete!
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold" style={{
            color: 'var(--primary)',
          }}>
            {sessionAccuracy}%
          </p>
          <p className="text-xs mt-1" style={{
            color: 'var(--text-secondary)',
          }}>Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{
            color: 'var(--admonitions-color-tip)',
          }}>
            +{totalXP}
          </p>
          <p className="text-xs mt-1" style={{
            color: 'var(--text-secondary)',
          }}>XP Earned</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold" style={{
            color: 'var(--admonitions-color-warning)',
          }}>
            {wordAttempts.length}/{totalWords}
          </p>
          <p className="text-xs mt-1" style={{
            color: 'var(--text-secondary)',
          }}>Words</p>
        </div>
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium mb-2" style={{
          color: 'var(--text-primary)',
        }}>
          Word Breakdown
        </h4>
        {wordAttempts.map((wa) => (
          <WordAttemptRow key={wa.word} wordAttempt={wa} />
        ))}
      </div>
    </div>
  );
}
