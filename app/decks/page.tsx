"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

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

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ── Create Deck Modal ──────────────────────────────────────────────────────────

function CreateDeckModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (deck: Deck) => void;
}) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    const { data, error: err } = await supabase
      .from("decks")
      .insert({ name: name.trim(), description: description.trim() || null, color, user_id: user.id })
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg text-[var(--deep-text)]">New Deck</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] text-[var(--text-tertiary)]">
            <XIcon />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Name</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Travel Vocabulary"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Description (optional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this deck about?"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide mb-2 block">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? "ring-2 ring-offset-2 ring-[var(--primary)] scale-110" : "hover:scale-105"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium text-[var(--deep-text)] bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gemini Suggestions Panel ───────────────────────────────────────────────────

function GeminiSuggestPanel({
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
      const body: any = {
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
    } catch (e: any) {
      setError(e.message);
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

// ── Deck Card ──────────────────────────────────────────────────────────────────

function DeckCard({
  deck,
  onDelete,
}: {
  deck: Deck;
  onDelete: (id: string) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);
  const [addingWord, setAddingWord] = useState(false);
  const [manualWord, setManualWord] = useState("");

  const loadEntries = useCallback(async () => {
    if (!open) return;
    setLoadingEntries(true);
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("deck_entries")
      .select("entry_id, entries(*)")
      .eq("deck_id", deck.id);
    setEntries((data ?? []).map((r: any) => r.entries).filter(Boolean));
    setLoadingEntries(false);
  }, [open, deck.id]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleAddWordFromSuggestion = async (word: string) => {
    if (!user) return;
    setAddingWord(true);
    const supabase = getSupabaseBrowserClient();

    // Check if entry already exists for this user
    const { data: existing } = await supabase
      .from("entries")
      .select("id")
      .eq("user_id", user.id)
      .ilike("word", word)
      .maybeSingle();

    let entryId = existing?.id;

    if (!entryId) {
      const { data: newEntry, error: insertErr } = await supabase
        .from("entries")
        .insert({ word, user_id: user.id, difficulty: 1, id: crypto.randomUUID() })
        .select("id")
        .single();
      if (insertErr) {
        console.error("Failed to create entry:", insertErr);
        setAddingWord(false);
        alert(`Error creating entry '${word}': ${insertErr.message ?? insertErr}`);
        return;
      }
      entryId = newEntry?.id;
    }

    if (entryId) {
      // Avoid `upsert` because it may perform an UPDATE which requires
      // an UPDATE policy on `deck_entries`. Instead, check for an
      // existing row and INSERT only when missing to satisfy RLS.
      const { data: existingDE } = await supabase
        .from("deck_entries")
        .select("*")
        .eq("deck_id", deck.id)
        .eq("entry_id", entryId)
        .maybeSingle();

      if (!existingDE) {
        const { error: deErr } = await supabase
          .from("deck_entries")
          .insert({ deck_id: deck.id, entry_id: entryId });
        if (deErr) {
          console.error("Failed to insert deck_entries:", deErr);
          alert(`Error adding '${word}' to deck: ${deErr.message ?? deErr}`);
        } else {
          await loadEntries();
        }
      } else {
        // already present
        await loadEntries();
      }
    }
    setAddingWord(false);
  };

  const handleAddManual = async () => {
    const word = manualWord.trim();
    if (!word || !user) return;
    setManualWord("");
    await handleAddWordFromSuggestion(word);
  };

  const handleDeleteDeck = async () => {
    if (!confirm(`Delete deck "${deck.name}"? This cannot be undone.`)) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from("decks").delete().eq("id", deck.id);
    onDelete(deck.id);
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] overflow-hidden">
      {/* Header bar with deck color */}
      <div className="h-1.5" style={{ background: deck.color ?? "var(--primary)" }} />

      <div className="p-4 space-y-3">
        {/* Deck title row */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setOpen(v => !v)}
            className="flex-1 flex items-start gap-3 text-left"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
              style={{ background: deck.color ?? "var(--primary)" }}
            >
              {deck.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--deep-text)] truncate">{deck.name}</p>
              {deck.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{deck.description}</p>
              )}
            </div>
            <span className="text-[var(--text-tertiary)] mt-0.5"><ChevronIcon open={open} /></span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setOpen(true); setShowSuggest(v => !v); }}
              title="Get Gemini suggestions"
              className="p-2 rounded-xl text-[var(--primary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
            >
              <SparkleIcon />
            </button>
            <button
              onClick={handleDeleteDeck}
              title="Delete deck"
              className="p-2 rounded-xl text-[var(--text-tertiary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Expanded content */}
        {open && (
          <div className="space-y-3">
            {/* Gemini panel */}
            {showSuggest && (
              <GeminiSuggestPanel
                deck={deck}
                onAddEntry={handleAddWordFromSuggestion}
              />
            )}

            {/* Entries list */}
            <div>
              <div className="flex gap-2 items-center">
                <input
                  value={manualWord}
                  onChange={e => setManualWord(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddManual()}
                  placeholder="Add word manually"
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
                />
                <button
                  onClick={handleAddManual}
                  disabled={!manualWord.trim()}
                  className="px-3 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
                >
                  Add
                </button>
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Words ({loadingEntries ? "…" : entries.length})
              </p>
              {loadingEntries ? (
                <p className="text-xs text-[var(--text-tertiary)] py-2">Loading…</p>
              ) : entries.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-2">
                  No words yet. Use Gemini suggestions or add words from your journal.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {entries.map(e => (
                    <span
                      key={e.id}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--btn-regular-bg)] text-[var(--deep-text)] border border-[var(--line-divider)]"
                    >
                      {e.word}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DecksPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();
    supabase
      .from("decks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDecks(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const handleCreated = (deck: Deck) => {
    setDecks(prev => [deck, ...prev]);
    setShowCreate(false);
  };

  const handleDeleted = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[var(--deep-text)]">My Decks</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Organize vocabulary by topic. Use Gemini to suggest words.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
        >
          <PlusIcon />
          New Deck
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl bg-[var(--btn-regular-bg)] animate-pulse" />
          ))}
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[var(--btn-regular-bg)] mx-auto flex items-center justify-center text-[var(--text-tertiary)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[var(--deep-text)]">No decks yet</p>
          <p className="text-xs text-[var(--text-tertiary)]">Create your first deck to organize vocabulary by theme.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
          >
            <PlusIcon />
            Create a deck
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map(deck => (
            <DeckCard key={deck.id} deck={deck} onDelete={handleDeleted} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateDeckModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
