"use client";

import { Difficulty } from "@/lib/types";

interface DifficultyFiltersProps {
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (difficulty: Difficulty | "all") => void;
}

export default function DifficultyFilters({
  selectedDifficulty,
  onDifficultyChange,
}: DifficultyFiltersProps) {
  const difficulties = [
    { value: "all", label: "Todos" },
    { value: "easy", label: "Fácil" },
    { value: "medium", label: "Medio" },
    { value: "hard", label: "Difícil" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {difficulties.map((difficulty) => (
        <button
          key={difficulty.value}
          onClick={() => onDifficultyChange(difficulty.value as Difficulty | "all")}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            selectedDifficulty === difficulty.value
              ? "text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 bg-gray-100 dark:bg-gray-700"
          }`}
          style={
            selectedDifficulty === difficulty.value
              ? { backgroundColor: "#5468FF" }
              : {}
          }
        >
          {difficulty.label}
        </button>
      ))}
    </div>
  );
}

