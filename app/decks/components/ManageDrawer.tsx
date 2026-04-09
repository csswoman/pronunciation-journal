"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Trash2, Plus, Settings2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { GeminiSuggestPanel } from "./GeminiSuggestPanel";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type DeckEntryRow = { entries: Entry | null };

interface ManageDrawerProps {
  deck: Deck;
  onClose: () => void;
  onWordCountChange?: (count: number) => void;
}

export function ManageDrawer({ deck, onClose, onWordCountChange }: ManageDrawerProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [manualWord, setManualWord] = useState("");
  const [manualPhrases, setManualPhrases] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [addingWord, setAddingWord] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingPhrases, setEditingPhrases] = useState("");

  const loadEntries = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("deck_entries")
      .select("entry_id, entries(*)")
      .eq("deck_id", deck.id);

    const loaded = ((data ?? []) as DeckEntryRow[]).map((r) => r.entries).filter(Boolean) as Entry[];
    setEntries(loaded);
    onWordCountChange?.(loaded.length);
    setLoading(false);
  }, [deck.id, onWordCountChange]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = entries.filter(e =>
    e.word.toLowerCase().includes(filter.toLowerCase())
  );

  const handleAddWord = async () => {
    const word = manualWord.trim();
    if (!word || !user) return;

    setAddingWord(true);
    const supabase = getSupabaseBrowserClient();

    try {
      // Check if entry already exists for this user
      const { data: existing } = await supabase
        .from("entries")
        .select("id")
        .eq("user_id", user.id)
        .ilike("word", word)
        .maybeSingle();

      let entryId = existing?.id;

      if (!entryId) {
        const phrases = manualPhrases.trim() ? manualPhrases.split('\n').map(p => p.trim()).filter(p => p) : null;
        const { data: newEntry, error: insertErr } = await supabase
          .from("entries")
          .insert({ word, user_id: user.id, difficulty: 1, phrases, id: crypto.randomUUID() })
          .select("id")
          .single();

        if (insertErr) throw insertErr;
        entryId = newEntry?.id;
      }

      if (entryId) {
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

          if (deErr) throw deErr;
        }

        setManualWord("");
        setManualPhrases("");
        await loadEntries();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Error adding word:", e);
      alert(`Error adding word: ${message}`);
    } finally {
      setAddingWord(false);
    }
  };

  const handleRemoveWord = async (entryId: string) => {
    const supabase = getSupabaseBrowserClient();

    try {
      await supabase
        .from("deck_entries")
        .delete()
        .eq("deck_id", deck.id)
        .eq("entry_id", entryId);

      await loadEntries();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Error removing word:", e);
      alert(`Error removing word: ${message}`);
    }
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setEditingPhrases(entry.phrases ? entry.phrases.join('\n') : '');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const phrases = editingPhrases.trim() ? editingPhrases.split('\n').map(p => p.trim()).filter(p => p) : null;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("entries")
      .update({ phrases, updated_at: new Date().toISOString() })
      .eq("id", editingEntry.id);

    if (error) {
      console.error("Error updating entry:", error);
      alert(`Error updating entry: ${error.message}`);
    } else {
      setEditingEntry(null);
      setEditingPhrases("");
      await loadEntries();
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditingPhrases("");
  };

  const handleAddFromSuggestion = async (word: string) => {
    setManualWord(word);
    setManualPhrases("");
    await new Promise(resolve => setTimeout(resolve, 100));
    await handleAddWord();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-[var(--card-bg)] border-l border-[var(--line-divider)] shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--line-divider)] bg-[var(--card-bg)]">
          <h2 className="font-semibold text-[var(--deep-text)]">Manage Deck</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] text-[var(--text-tertiary)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search */}
          <div>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter words…"
              className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            />
          </div>

          {/* Words section */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
              Words ({loading ? "…" : filteredEntries.length})
            </p>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-[var(--btn-regular-bg)] rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filteredEntries.length === 0 && entries.length === 0 ? (
              <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                <p>No words yet</p>
                <p className="mt-1">Add words manually or use AI suggestions</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-4 text-xs text-[var(--text-tertiary)]">
                No matching words
              </div>
            ) : (
              <div className="space-y-1">
                {filteredEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] group transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--deep-text)] truncate">
                        {entry.word}
                      </p>
                      {entry.ipa && (
                        <p className="text-xs text-[var(--text-tertiary)]">/{entry.ipa}/</p>
                      )}
                      {entry.phrases && entry.phrases.length > 0 && (
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {entry.phrases[0]}{entry.phrases.length > 1 ? ` (+${entry.phrases.length - 1})` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditEntry(entry)}
                        className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--primary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
                        title="Edit phrases"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveWord(entry.id)}
                        className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add word input */}
          <div className="space-y-2">
            <input
              value={manualWord}
              onChange={e => setManualWord(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddWord()}
              placeholder="Add word…"
              className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
            />
            <textarea
              value={manualPhrases}
              onChange={e => setManualPhrases(e.target.value)}
              placeholder="Add phrases (one per line, optional)…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none"
            />
            <button
              onClick={handleAddWord}
              disabled={!manualWord.trim() || addingWord}
              className="w-full px-3 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* AI Suggestions */}
          <div className="pt-2">
            <button
              onClick={() => setShowSuggest(!showSuggest)}
              className="text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              {showSuggest ? "Hide" : "Show"} AI suggestions
            </button>
            {showSuggest && (
              <div className="mt-3">
                <GeminiSuggestPanel
                  deck={deck}
                  onAddEntry={handleAddFromSuggestion}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--card-bg)] rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-[var(--deep-text)] mb-4">
              Edit phrases for "{editingEntry.word}"
            </h3>
            <textarea
              value={editingPhrases}
              onChange={e => setEditingPhrases(e.target.value)}
              placeholder="Enter phrases, one per line…"
              rows={4}
              className="w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40 resize-none mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
