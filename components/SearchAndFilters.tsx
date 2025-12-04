"use client";

import { Difficulty } from "@/lib/types";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (difficulty: Difficulty | "all") => void;
}

export default function SearchAndFilters({
  searchTerm,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
}: SearchAndFiltersProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Mi vocabulario
      </h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Buscar
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar palabra..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-transparent transition-colors"
            style={{ "--tw-ring-color": "#5468FF" } as React.CSSProperties & { "--tw-ring-color"?: string }}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Dificultad
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "Todos" },
            { value: "easy", label: "Fácil" },
            { value: "medium", label: "Medio" },
            { value: "hard", label: "Difícil" },
          ].map((difficulty) => (
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
      </div>
    </div>
  );
}

