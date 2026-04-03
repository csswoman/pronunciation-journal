"use client";

import { useState } from "react";
import type { WordAttempt } from "@/hooks/useLesson";

function getAccuracyColor(acc: number): string {
  if (acc >= 80) return "var(--admonitions-color-tip)";
  if (acc >= 60) return "var(--admonitions-color-warning)";
  return "var(--admonitions-color-caution)";
}

function getChipStyle(acc: number, isBest: boolean): React.CSSProperties {
  if (isBest) {
    return {
      backgroundColor: "var(--admonitions-color-tip)",
      color: "white",
      borderColor: "var(--admonitions-color-tip)",
    };
  }
  if (acc >= 60) {
    return {
      backgroundColor: "var(--admonitions-color-warning)",
      color: "white",
      borderColor: "var(--admonitions-color-warning)",
    };
  }
  return {
    backgroundColor: "var(--admonitions-color-caution)",
    color: "white",
    borderColor: "var(--admonitions-color-caution)",
  };
}

export default function WordAttemptRow({ wordAttempt }: { wordAttempt: WordAttempt }) {
  const [open, setOpen] = useState(false);
  const { word, attempts, best } = wordAttempt;
  const passed = best >= 70;
  const hasRetries = attempts.length > 1;

  return (
    <div className="rounded-lg overflow-hidden" style={{
      backgroundColor: "var(--btn-regular-bg)",
    }}>
      <button
        onClick={() => hasRetries && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between py-2 px-3 text-left ${hasRetries ? "cursor-pointer" : "cursor-default"} transition-colors`}
        style={{
          color: "var(--text-primary)",
        }}
      >
        <div className="flex items-center gap-2">
          <span>{passed ? "✅" : "❌"}</span>
          <span className="text-sm font-medium">{word}</span>
          {hasRetries && (
            <span className="text-xs" style={{
              color: "var(--text-secondary)",
            }}>
              {attempts.length} intentos
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{
            color: getAccuracyColor(best),
          }}>
            {best}%
          </span>
          {hasRetries && (
            <svg
              className="w-4 h-4 transition-transform"
              style={{
                color: "var(--text-secondary)",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </button>

      {open && hasRetries && (
        <div className="px-3 pb-3 flex flex-wrap gap-1.5">
          {attempts.map((acc, i) => {
            const isBest = acc === best && i === attempts.lastIndexOf(best);
            return (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full border font-medium"
                style={{
                  ...getChipStyle(acc, isBest),
                }}
              >
                {acc}%
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
