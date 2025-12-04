"use client";

import { Difficulty } from "@/lib/types";

interface NavbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedDifficulty: Difficulty | "all";
  onDifficultyChange: (difficulty: Difficulty | "all") => void;
}

export default function Navbar({
  searchTerm,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
}: NavbarProps) {
  return (
    <nav className="bg-white col-span-3 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen py-6">
      <div className="px-4">
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
          <ul className="flex flex-row space-x-2">
            <li>
              <button
                onClick={() => onDifficultyChange("all")}
                className={`w-full text-left text-sm px-4 py-2 rounded-lg transition-colors ${
                  selectedDifficulty === "all"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                style={
                  selectedDifficulty === "all"
                    ? { backgroundColor: "#5468FF" }
                    : {}
                }
              >
                Todos
              </button>
            </li>
            <li>
              <button
                onClick={() => onDifficultyChange("easy")}
                className={`w-full text-sm text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedDifficulty === "easy"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                style={
                  selectedDifficulty === "easy"
                    ? { backgroundColor: "#5468FF" }
                    : {}
                }
              >
                Fácil
              </button>
            </li>
            <li>
              <button
                onClick={() => onDifficultyChange("medium")}
                className={`w-full text-sm text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedDifficulty === "medium"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                style={
                  selectedDifficulty === "medium"
                    ? { backgroundColor: "#5468FF" }
                    : {}
                }
              >
                Medio
              </button>
            </li>
            <li>
              <button
                onClick={() => onDifficultyChange("hard")}
                className={`w-full text-sm text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedDifficulty === "hard"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                style={
                  selectedDifficulty === "hard"
                    ? { backgroundColor: "#5468FF" }
                    : {}
                }
              >
                Difícil
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

