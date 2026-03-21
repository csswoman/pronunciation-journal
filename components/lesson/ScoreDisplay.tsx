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
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">
        🎉 Lesson Complete!
      </h3>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {sessionAccuracy}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            +{totalXP}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">XP Earned</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {wordAttempts.length}/{totalWords}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Words</p>
        </div>
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Word Breakdown
        </h4>
        {wordAttempts.map((wa) => (
          <WordAttemptRow key={wa.word} wordAttempt={wa} />
        ))}
      </div>
    </div>
  );
}
