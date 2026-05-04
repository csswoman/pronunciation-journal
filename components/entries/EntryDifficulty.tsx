"use client";

import Button from "@/components/ui/Button";
import { Difficulty } from "@/lib/types";

export interface EntryDifficultyProps {
  isEditing: boolean;
  currentDifficulty: Difficulty;
  editedDifficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
}

const DIFFICULTY_DOTS: Record<Difficulty, string> = {
  easy: "dot-success",
  medium: "dot-warning",
  hard: "dot-warning",
};

export default function EntryDifficulty({
  isEditing,
  currentDifficulty,
  editedDifficulty,
  onDifficultyChange,
}: EntryDifficultyProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-fg-muted mb-2">
        Difficulty:
      </label>
      {!isEditing ? (
        <span className="badge">
          <span className={DIFFICULTY_DOTS[currentDifficulty]} />
          {currentDifficulty}
        </span>
      ) : (
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
            <Button
              key={diff}
              onClick={() => onDifficultyChange(diff)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                editedDifficulty === diff ? "text-on-primary" : "badge hover:opacity-80"
              }`}
              style={
                editedDifficulty === diff
                  ? { backgroundColor: "var(--color-accent)", color: "var(--color-text-on-accent)" }
                  : {}
              }
            >
              {editedDifficulty !== diff && <span className={DIFFICULTY_DOTS[diff]} />}
              {diff.charAt(0).toUpperCase() + diff.slice(1)}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
