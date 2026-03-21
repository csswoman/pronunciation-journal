"use client";

import { useState } from "react";
import type { WordAttempt } from "@/hooks/useLesson";

function accuracyColor(acc: number): string {
  if (acc >= 80) return "text-green-600 dark:text-green-400";
  if (acc >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function chipColor(acc: number, isBest: boolean): string {
  if (isBest) return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700";
  if (acc >= 60) return "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700";
  return "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700";
}

export default function WordAttemptRow({ wordAttempt }: { wordAttempt: WordAttempt }) {
  const [open, setOpen] = useState(false);
  const { word, attempts, best } = wordAttempt;
  const passed = best >= 70;
  const hasRetries = attempts.length > 1;

  return (
    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 overflow-hidden">
      <button
        onClick={() => hasRetries && setOpen((o) => !o)}
        className={`w-full flex items-center justify-between py-2 px-3 text-left ${hasRetries ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" : "cursor-default"} transition-colors`}
      >
        <div className="flex items-center gap-2">
          <span>{passed ? "✅" : "❌"}</span>
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{word}</span>
          {hasRetries && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{attempts.length} intentos</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${accuracyColor(best)}`}>{best}%</span>
          {hasRetries && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${chipColor(acc, isBest)}`}
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
