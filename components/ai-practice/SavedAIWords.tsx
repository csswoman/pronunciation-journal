"use client";
import Button from "@/components/ui/Button";

import type { AISavedWord, Difficulty } from "@/lib/types";

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  easy: "dot-success",
  medium: "dot-warning",
  hard: "dot-warning",
};

interface SavedAIWordsProps {
  words: AISavedWord[];
  onDelete: (id: number) => void;
}

export default function SavedAIWords({ words, onDelete }: SavedAIWordsProps) {
  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-fg-subtle">
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
          className="flex items-start gap-3 p-3 bg-surface-raised rounded-xl border border-border-subtle"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-fg text-sm">
                {w.word}
              </span>
              <span className="badge">
                <span className={DIFFICULTY_DOT[w.difficulty]} />
                {w.difficulty}
              </span>
            </div>
            {w.meaning && (
              <p className="text-xs text-fg-muted mt-0.5">{w.meaning}</p>
            )}
            {w.context && w.context !== w.word && (
              <p className="text-xs text-fg-subtle mt-1 italic truncate">
                &ldquo;{w.context}&rdquo;
              </p>
            )}
          </div>
          <Button
            onClick={() => w.id && onDelete(w.id)}
            className="flex-shrink-0 text-fg-disabled hover:text-error transition-colors mt-0.5"
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
