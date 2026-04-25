"use client";

import Button from "@/components/ui/Button";
import { Difficulty } from "@/lib/types";

export interface EntryDifficultyProps {
  isEditing: boolean;
  currentDifficulty: Difficulty;
  editedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  medium: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  hard: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};

export default function EntryDifficulty({
  isEditing,
  currentDifficulty,
  editedDifficulty,
  onDifficultyChange,
}: EntryDifficultyProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Difficulty:
      </label>
      {!isEditing ? (
        <span
          className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${DIFFICULTY_STYLES[currentDifficulty]}`}
        >
          {currentDifficulty}
        </span>
      ) : (
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                editedDifficulty === diff ? "text-white" : `${DIFFICULTY_STYLES[diff]} hover:opacity-80`
              }`}
              style={
                editedDifficulty === diff
                  ? { backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)" }
                  : {}
              }
            >
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
