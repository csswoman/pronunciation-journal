"use client";

import { useState } from "react";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3zM19 13l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function GeminiSuggestPanel({
  deck,
  onAddEntry,
}: {
  deck: Deck;
  onAddEntry: (word: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ word: string; meaning: string }[]>([]);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<number>(1);
  const [seed, setSeed] = useState<string | number | null>(null);

  const fetchSuggestions = async (opts?: { difficulty?: number; redo?: boolean }) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    if (opts?.redo) setAdded(new Set());
    try {
      const body: { deckName: string; deckDescription: string; difficulty?: number; seed?: string | number } = {
        deckName: deck.name,
        deckDescription: deck.description ?? "",
      };
      if (typeof opts?.difficulty === "number") body.difficulty = opts?.difficulty;
      // provide a seed to encourage variation when redoing
      const localSeed = opts?.redo ? (Math.random().toString(36).slice(2, 9)) : seed ?? undefined;
      if (localSeed) {
        body.seed = localSeed;
        setSeed(localSeed);
      }

      const res = await fetch("/api/gemini/deck-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get suggestions");
      setSuggestions(data.suggestions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (word: string) => {
    onAddEntry(word);
    setAdded(prev => new Set([...prev, word]));
  };

  return (
    <div className="bg-[var(--btn-regular-bg)] rounded-2xl border border-[var(--line-divider)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--primary)]"><SparkleIcon /></span>
          <span className="text-sm font-semibold text-[var(--deep-text)]">Gemini Suggestions</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchSuggestions({ difficulty })}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Thinking…" : "Suggest words"}
          </button>
          <button
            onClick={() => fetchSuggestions({ difficulty, redo: true })}
            disabled={loading}
            title="Get a different set of suggestions"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--btn-regular-bg)] text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
          >
            Re-do
          </button>
          <button
            onClick={() => {
              const next = Math.min(3, difficulty + 1);
              setDifficulty(next);
              fetchSuggestions({ difficulty: next });
            }}
            disabled={loading}
            title="Suggest more difficult words"
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--btn-regular-bg)] text-[var(--deep-text)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
          >
            Harder
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={async () => {
                // Save all suggestions not yet added
                const toAdd = suggestions.map(s => s.word).filter(w => !added.has(w));
                for (const w of toAdd) {
                  await onAddEntry(w);
                }
                setAdded(prev => new Set([...Array.from(prev), ...toAdd]));
              }}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
            >
              Save all
            </button>
          </div>
          {suggestions.map(s => (
            <div key={s.word} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--line-divider)]">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--deep-text)]">{s.word}</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{s.meaning}</p>
              </div>
              <button
                onClick={() => handleAdd(s.word)}
                disabled={added.has(s.word)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  added.has(s.word)
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-[var(--primary)] text-white hover:opacity-90"
                }`}
              >
                {added.has(s.word) ? "Added" : <><PlusIcon /> Add</>}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <p className="text-xs text-[var(--text-tertiary)] text-center py-2">
          Click "Suggest words" to get AI-powered vocabulary for this deck's theme.
        </p>
      )}
    </div>
  );
}
