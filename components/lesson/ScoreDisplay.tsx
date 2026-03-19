"use client";

import type { ScoringResult } from "@/lib/types";

interface ScoreDisplayProps {
  results: ScoringResult[];
  sessionAccuracy: number;
  totalXP: number;
  totalWords: number;
}

export default function ScoreDisplay({
  results,
  sessionAccuracy,
  totalXP,
  totalWords,
}: ScoreDisplayProps) {
  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      {/* Session Summary */}
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
            {results.length}/{totalWords}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Words</p>
        </div>
      </div>

      {/* Per-word breakdown */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Word Breakdown
        </h4>
        {results.map((result, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <div className="flex items-center gap-2">
              <span className={result.accuracy >= 70 ? "text-green-500" : "text-red-500"}>
                {result.accuracy >= 70 ? "✅" : "❌"}
              </span>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {result.wordResults.map((w) => w.expected || w.got).join(" ")}
              </span>
            </div>
            <span
              className={`text-sm font-semibold ${
                result.accuracy >= 80
                  ? "text-green-600 dark:text-green-400"
                  : result.accuracy >= 60
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {result.accuracy}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
