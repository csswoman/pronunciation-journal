"use client";

import type { WordResult, PhonemeAlignment } from "@/lib/types";

interface PronunciationFeedbackProps {
  wordResults: WordResult[];
  accuracy: number;
  feedback: { message: string; emoji: string; color: string };
  xpEarned: number;
}

function PhonemeChips({ alignment }: { alignment: PhonemeAlignment[] }) {
  if (alignment.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {alignment.map((p, i) => (
        <span
          key={i}
          title={p.status === "incorrect" ? `heard: ${p.got}` : p.status}
          className={`
            text-[10px] font-mono px-1.5 py-0.5 rounded border
            ${
              p.status === "correct"
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                : p.status === "missing"
                ? "bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-600 line-through"
                : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
            }
          `}
        >
          {p.phoneme}
        </span>
      ))}
    </div>
  );
}

export default function PronunciationFeedback({
  wordResults,
  accuracy,
  feedback,
  xpEarned,
}: PronunciationFeedbackProps) {
  return (
    <div className="w-full animate-fadeIn">
      {/* Accuracy Score */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold mb-1">
          <span className={feedback.color}>{accuracy}%</span>
        </div>
        <p className={`text-lg font-medium ${feedback.color}`}>
          {feedback.emoji} {feedback.message}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          +{xpEarned} XP
        </p>
      </div>

      {/* Accuracy Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${accuracy}%`,
            background:
              accuracy >= 80
                ? "linear-gradient(90deg, #22c55e, #10b981)"
                : accuracy >= 60
                ? "linear-gradient(90deg, #eab308, #f59e0b)"
                : "linear-gradient(90deg, #ef4444, #f97316)",
          }}
        />
      </div>

      {/* Word-by-word Results */}
      <div className="flex flex-wrap gap-3 justify-center">
        {wordResults.map((result, idx) => (
          <div
            key={idx}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium
              ${
                result.status === "correct"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                  : result.status === "incorrect"
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                  : result.status === "missing"
                  ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 opacity-60"
                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
              }
            `}
          >
            {/* Word label */}
            <div className="flex items-center gap-1">
              <span>
                {result.status === "correct"
                  ? "✅"
                  : result.status === "incorrect"
                  ? "❌"
                  : result.status === "missing"
                  ? "⬜"
                  : "➕"}
              </span>
              <span>{result.expected || result.got}</span>
            </div>

            {/* Phoneme chips */}
            {result.phonemes?.alignment && result.phonemes.alignment.length > 0 && (
              <PhonemeChips alignment={result.phonemes.alignment} />
            )}

            {/* Heard word (incorrect only) */}
            {result.status === "incorrect" && result.got && (
              <div className="text-xs mt-1.5 opacity-75">
                heard: &ldquo;{result.got}&rdquo;
              </div>
            )}

            {/* Pronunciation tip */}
            {result.status === "incorrect" && result.phonemes?.tip && (
              <div className="text-xs mt-1 text-red-500 dark:text-red-400">
                💡 {result.phonemes.tip}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
