"use client";

import { Difficulty } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface DifficultyFiltersProps {
  selectedDifficulties: Difficulty[];
  onDifficultyChange: (difficulties: Difficulty[]) => void;
}

export default function DifficultyFilters({
  selectedDifficulties,
  onDifficultyChange,
}: DifficultyFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: "easy", label: "Fácil", color: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" },
    { value: "medium", label: "Medio", color: "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200" },
    { value: "hard", label: "Difícil", color: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDifficulty = (difficulty: Difficulty) => {
    if (selectedDifficulties.includes(difficulty)) {
      onDifficultyChange(selectedDifficulties.filter(d => d !== difficulty));
    } else {
      onDifficultyChange([...selectedDifficulties, difficulty]);
    }
  };

  const getButtonLabel = () => {
    if (selectedDifficulties.length === 0) {
      return "Todas las dificultades";
    }
    if (selectedDifficulties.length === 3) {
      return "Todas las dificultades";
    }
    return `${selectedDifficulties.length} seleccionada${selectedDifficulties.length > 1 ? 's' : ''}`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
            clipRule="evenodd"
          />
        </svg>
        {getButtonLabel()}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="py-2">
            {difficulties.map((difficulty) => (
              <label
                key={difficulty.value}
                className="flex items-center px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(difficulty.value)}
                  onChange={() => toggleDifficulty(difficulty.value)}
                  className="w-4 h-4 rounded border-gray-300 text-[#5468FF] focus:ring-[#5468FF] focus:ring-offset-0 cursor-pointer"
                  style={{ accentColor: "#5468FF" }}
                />
                <span
                  className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${difficulty.color}`}
                >
                  {difficulty.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

