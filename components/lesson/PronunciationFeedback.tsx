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
      {alignment.map((p, i) => {
        let bgColor = "var(--admonitions-color-tip)";
        let textColor = "white";
        let borderColor = "var(--admonitions-color-tip)";
        let textDecoration = "none";

        if (p.status === "missing") {
          bgColor = "var(--btn-regular-bg)";
          textColor = "var(--text-secondary)";
          borderColor = "var(--line-divider)";
          textDecoration = "line-through";
        } else if (p.status === "incorrect") {
          bgColor = "var(--admonitions-color-caution)";
          textColor = "white";
          borderColor = "var(--admonitions-color-caution)";
        }

        return (
          <span
            key={i}
            title={p.status === "incorrect" ? `heard: ${p.got}` : p.status}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
            style={{
              backgroundColor: bgColor,
              color: textColor,
              borderColor: borderColor,
              textDecoration: textDecoration,
            }}
          >
            {p.phoneme}
          </span>
        );
      })}
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
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          +{xpEarned} XP
        </p>
      </div>

      {/* Accuracy Bar */}
      <div className="w-full rounded-full h-3 mb-6 overflow-hidden" style={{
        backgroundColor: 'var(--line-divider)',
      }}>
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${accuracy}%`,
            background:
              accuracy >= 80
                ? `linear-gradient(90deg, var(--admonitions-color-tip), var(--admonitions-color-tip))`
                : accuracy >= 60
                ? `linear-gradient(90deg, var(--admonitions-color-warning), var(--admonitions-color-warning))`
                : `linear-gradient(90deg, var(--admonitions-color-caution), var(--admonitions-color-caution))`,
          }}
        />
      </div>

      {/* Word-by-word Results */}
      <div className="flex flex-wrap gap-3 justify-center">
        {wordResults.map((result, idx) => {
          let bgColor = "var(--btn-regular-bg)";
          let textColor = "var(--text-secondary)";
          let borderColor = "var(--line-divider)";
          let opacity = "1";

          if (result.status === "correct") {
            bgColor = "var(--admonitions-color-tip)";
            textColor = "white";
            borderColor = "var(--admonitions-color-tip)";
          } else if (result.status === "incorrect") {
            bgColor = "var(--admonitions-color-caution)";
            textColor = "white";
            borderColor = "var(--admonitions-color-caution)";
          } else if (result.status === "missing") {
            bgColor = "var(--admonitions-color-warning)";
            textColor = "white";
            borderColor = "var(--admonitions-color-warning)";
            opacity = "0.6";
          } else {
            bgColor = "var(--admonitions-color-warning)";
            textColor = "white";
            borderColor = "var(--admonitions-color-warning)";
          }

          return (
            <div
              key={idx}
              className="px-3 py-2 rounded-lg text-sm font-medium border"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                borderColor: borderColor,
                opacity: opacity,
              }}
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
                <div className="text-xs mt-1" style={{ color: 'var(--admonitions-color-caution)' }}>
                  💡 {result.phonemes.tip}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
