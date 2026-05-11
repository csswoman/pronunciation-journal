"use client";

import { useState } from "react";
import { Sparkles, RefreshCw, Plus, Check, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

const DIFFICULTY_LEVELS = [
  { value: 1, label: "A1–A2", desc: "Beginner" },
  { value: 2, label: "B1–B2", desc: "Intermediate" },
  { value: 3, label: "C1–C2", desc: "Advanced" },
];

export function GeminiSuggestPanel({
  deck,
  existingWords,
  onAddEntry,
}: {
  deck: Deck;
  existingWords?: string[];
  onAddEntry: (word: string, meaning?: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ word: string; meaning: string }[]>([]);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState<number>(1);
  const [seed, setSeed] = useState<string | number | null>(null);
  const [savingAll, setSavingAll] = useState(false);

  const fetchSuggestions = async (opts?: { difficulty?: number; redo?: boolean }) => {
    setLoading(true);
    setError("");
    setSuggestions([]);
    if (opts?.redo) setAdded(new Set());
    try {
      const body: { deckName: string; deckDescription: string; difficulty?: number; seed?: string | number; existingWords?: string[] } = {
        deckName: deck.name,
        deckDescription: deck.description ?? "",
        existingWords: existingWords && existingWords.length > 0 ? existingWords : undefined,
      };
      if (typeof opts?.difficulty === "number") body.difficulty = opts.difficulty;
      const localSeed = opts?.redo ? Math.random().toString(36).slice(2, 9) : seed ?? undefined;
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

  const handleAdd = (word: string, meaning: string) => {
    onAddEntry(word, meaning);
    setAdded(prev => new Set([...prev, word]));
  };

  const handleSaveAll = async () => {
    setSavingAll(true);
    const toAdd = suggestions.filter(s => !added.has(s.word));
    for (const s of toAdd) await onAddEntry(s.word, s.meaning);
    setAdded(prev => new Set([...Array.from(prev), ...toAdd.map(s => s.word)]));
    setSavingAll(false);
  };

  const allAdded = suggestions.length > 0 && suggestions.every(s => added.has(s.word));

  return (
    <div className="space-y-4">
      {/* Difficulty selector */}
      <div>
        <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle mb-2">
          Difficulty level
        </p>
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--btn-regular-bg)] rounded-xl border border-[var(--line-divider)]">
          {DIFFICULTY_LEVELS.map(lvl => (
            <button
              key={lvl.value}
              onClick={() => setDifficulty(lvl.value)}
              className={`py-2 px-1 rounded-lg text-center transition-all ${
                difficulty === lvl.value
                  ? "bg-[var(--card-bg)] shadow-sm border border-[var(--line-divider)] text-fg"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <p className="text-xs font-semibold">{lvl.label}</p>
              <p className="text-tiny opacity-70">{lvl.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Action row */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          disabled={loading}
          onClick={() => fetchSuggestions({ difficulty })}
          icon={loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          className="flex-1 py-2.5"
        >
          {loading ? "Thinking…" : "Suggest words"}
        </Button>
        {suggestions.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            disabled={loading}
            title="Get a different set"
            onClick={() => fetchSuggestions({ difficulty, redo: true })}
          >
            <RefreshCw size={14} />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-xs text-error bg-error-soft rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Suggestions list */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          {/* Save all bar */}
          <div className="flex items-center justify-between">
            <p className="text-tiny font-semibold uppercase tracking-widest text-fg-subtle">
              {suggestions.length} suggestions
            </p>
            {!allAdded && (
              <Button
                variant="ghost"
                size="sm"
                disabled={savingAll}
                onClick={handleSaveAll}
                icon={savingAll ? <RefreshCw size={11} className="animate-spin" /> : <ChevronRight size={11} />}
                className="text-xs text-[var(--primary)]"
              >
                Add all
              </Button>
            )}
            {allAdded && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success">
                <Check size={11} /> All added
              </span>
            )}
          </div>

          {suggestions.map((s, i) => (
            <div
              key={s.word}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--line-divider)] group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg">{s.word}</p>
                <p className="text-xs text-fg-muted leading-relaxed line-clamp-2">{s.meaning}</p>
              </div>
              <button
                onClick={() => handleAdd(s.word, s.meaning)}
                disabled={added.has(s.word)}
                className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg transition-all ${
                  added.has(s.word)
                    ? "bg-success-soft text-success"
                    : "bg-[var(--primary)] text-on-primary hover:opacity-80"
                }`}
              >
                {added.has(s.word) ? <Check size={14} /> : <Plus size={14} />}
              </button>
            </div>
          ))}
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className="text-center py-8 space-y-1">
          <p className="text-sm text-fg-muted">No suggestions yet</p>
          <p className="text-xs text-fg-subtle">Pick a level and click "Suggest words"</p>
        </div>
      )}
    </div>
  );
}
