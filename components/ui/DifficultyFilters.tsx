"use client";

import { Difficulty } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Filter } from "lucide-react";
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
          <Filter className="h-4 w-4" />
        }
      >
        {getButtonLabel()}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
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
                  className="h-4 w-4 cursor-pointer rounded border-border-default text-accent accent-[var(--color-accent)] focus:ring-accent focus:ring-offset-0"
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




