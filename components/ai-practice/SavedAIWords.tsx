"use client";
import Button from "@/components/ui/Button";

import type { AISavedWord, Difficulty } from "@/lib/types";

const DIFFICULTY_BADGE: Record<Difficulty, string> = {
  easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  medium: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
};

interface SavedAIWordsProps {
  words: AISavedWord[];
  onDelete: (id: number) => void;
}

export default function SavedAIWords({ words, onDelete }: SavedAIWordsProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 dark:text-gray-500">
        <p className="text-3xl mb-2">📚</p>
        <p className="text-sm">No saved words yet.</p>
        <p className="text-xs mt-1">Select any word in an AI response to save it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {words.map((w) => (
        <div
          key={w.id}
          className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {w.word}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${DIFFICULTY_BADGE[w.difficulty]}`}
              >
                {w.difficulty}
              </span>
            </div>
            {w.meaning && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{w.meaning}</p>
            )}
            {w.context && w.context !== w.word && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 italic truncate">
                &ldquo;{w.context}&rdquo;
              </p>
            )}
          </div>
          <Button
            onClick={() => w.id && onDelete(w.id)}
            className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5"
            aria-label="Delete word"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
      ))}
    </div>
  );
}

