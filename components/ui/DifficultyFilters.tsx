"use client";

import { Difficulty } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import Button from "@/components/ui/Button";

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

  const difficulties: { value: Difficulty; label: string; dot: string }[] = [
    { value: "easy", label: "Fácil", dot: "dot-success" },
    { value: "medium", label: "Medio", dot: "dot-warning" },
    { value: "hard", label: "Difícil", dot: "dot-warning" },
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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="secondary"
        size="md"
        className="text-fg-muted"
        icon={
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
        }
      >
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
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-raised border border-border-default rounded-lg shadow-lg z-50">
          <div className="py-2">
            {difficulties.map((difficulty) => (
              <label
                key={difficulty.value}
                className="flex items-center px-4 py-2 hover:bg-surface-sunken cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(difficulty.value)}
                  onChange={() => toggleDifficulty(difficulty.value)}
                  className="w-4 h-4 rounded border-border-default text-accent focus:ring-accent focus:ring-offset-0 cursor-pointer"
                  style={{ accentColor: "var(--color-accent)" }}
                />
                <span className="ml-3 badge">
                  <span className={difficulty.dot} />
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




