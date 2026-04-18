"use client";

import { useState } from "react";
import type { Difficulty } from "@/lib/types";
import Button from "@/components/ui/Button";

interface SaveWordData {
  word: string;
  meaning: string;
  difficulty: Difficulty;
  context: string;
}

interface SaveWordModalProps {
  word: string;
  context: string;
  onConfirm: (data: SaveWordData) => void;
  onClose: () => void;
}

const DIFFICULTIES: { value: Difficulty; label: string; color: string }[] = [
  { value: "easy", label: "Easy", color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700" },
  { value: "medium", label: "Medium", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700" },
  { value: "hard", label: "Hard", color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700" },
];

export default function SaveWordModal({ word, context, onConfirm, onClose }: SaveWordModalProps) {
  const [meaning, setMeaning] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ word, meaning, difficulty, context });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            Save Vocabulary
          </h3>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          >
          </Button>
        </div>

        <div className="px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">{word}</p>
          {context !== word && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">&ldquo;{context}&rdquo;</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meaning <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Add a definition or translation..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Difficulty
            </label>
            <div className="flex gap-2">
              {DIFFICULTIES.map((d) => (
                <Button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  variant={difficulty === d.value ? "primary" : "secondary"}
                  size="sm"
                  className={`flex-1 ${
                    difficulty === d.value
                      ? d.color + " ring-2 ring-offset-1 ring-current"
                      : "text-gray-500"
                  }`}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              size="lg"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              Save Word
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
