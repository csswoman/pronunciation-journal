"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { GeminiSuggestPanel } from "./GeminiSuggestPanel";
import { DrawerHeader } from "./DrawerHeader";
import { EntryList } from "./EntryList";
import { AddWordForm } from "./AddWordForm";
import { EditEntryModal } from "./EditEntryModal";
import Button from "@/components/ui/Button";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type DeckEntryRow = { entries: Entry | null };

interface ManageDrawerProps {
  deck: Deck;
  onClose: () => void;
  onWordCountChange?: (count: number) => void;
}

function useManageDrawer(deck: Deck, onWordCountChange?: (count: number) => void) {
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

    const loaded = ((data ?? []) as DeckEntryRow[]).map(r => r.entries).filter(Boolean) as Entry[];
    setEntries(loaded);
    onWordCountChange?.(loaded.length);
    setLoading(false);
  }, [deck.id, onWordCountChange]);

  useEffect(() => { loadEntries(); }, [loadEntries]);

  const handleAddWord = async () => {
    const word = manualWord.trim();
    if (!word || !user) return;

    setAddingWord(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: existing } = await supabase
        .from("entries")
        .select("id")
        .eq("user_id", user.id)
        .ilike("word", word)
        .maybeSingle();

      let entryId = existing?.id;

      if (!entryId) {
        const phrases = manualPhrases.trim() ? manualPhrases.split("\n").map(p => p.trim()).filter(p => p) : null;
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
      alert(`Error adding word: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setAddingWord(false);
    }
  };

  const handleRemoveWord = async (entryId: string) => {
    const supabase = getSupabaseBrowserClient();
    try {
      await supabase.from("deck_entries").delete().eq("deck_id", deck.id).eq("entry_id", entryId);
      await loadEntries();
    } catch (e: unknown) {
      alert(`Error removing word: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    setEditingPhrases(entry.phrases ? entry.phrases.join("\n") : "");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    const phrases = editingPhrases.trim() ? editingPhrases.split("\n").map(p => p.trim()).filter(p => p) : null;
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("entries")
      .update({ phrases, updated_at: new Date().toISOString() })
      .eq("id", editingEntry.id);

    if (error) {
      alert(`Error updating entry: ${error.message}`);
    } else {
      setEditingEntry(null);
      setEditingPhrases("");
      await loadEntries();
    }
  };

  const handleAddFromSuggestion = async (word: string) => {
    setManualWord(word);
    setManualPhrases("");
    await new Promise(resolve => setTimeout(resolve, 100));
    await handleAddWord();
  };

  return {
    entries, loading, filter, setFilter,
    manualWord, setManualWord,
    manualPhrases, setManualPhrases,
    showSuggest, setShowSuggest,
    addingWord,
    editingEntry, editingPhrases, setEditingPhrases,
    handleAddWord, handleRemoveWord,
    handleEditEntry, handleSaveEdit,
    handleCancelEdit: () => { setEditingEntry(null); setEditingPhrases(""); },
    handleAddFromSuggestion,
  };
}

export function ManageDrawer({ deck, onClose, onWordCountChange }: ManageDrawerProps) {
  const state = useManageDrawer(deck, onWordCountChange);

  return (
    <>
      <div className="fixed inset-0 z-30 bg-black/20 transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-[var(--card-bg)] border-l border-[var(--line-divider)] shadow-2xl overflow-y-auto">
        <DrawerHeader onClose={onClose} />

        <div className="p-4 space-y-4">
          <EntryList
            entries={state.entries}
            loading={state.loading}
            filter={state.filter}
            onFilterChange={state.setFilter}
            onEdit={state.handleEditEntry}
            onRemove={state.handleRemoveWord}
          />

          <AddWordForm
            word={state.manualWord}
            phrases={state.manualPhrases}
            adding={state.addingWord}
            onWordChange={state.setManualWord}
            onPhrasesChange={state.setManualPhrases}
            onSubmit={state.handleAddWord}
          />

          <div className="pt-2">
            <Button
              onClick={() => state.setShowSuggest(!state.showSuggest)}
              className="text-xs font-semibold text-[var(--primary)] hover:opacity-80 transition-opacity"
            >
              {state.showSuggest ? "Hide" : "Show"} AI suggestions
            </Button>
            {state.showSuggest && (
              <div className="mt-3">
                <GeminiSuggestPanel deck={deck} onAddEntry={state.handleAddFromSuggestion} />
              </div>
            )}
          </div>
        </div>
      </div>

      {state.editingEntry && (
        <EditEntryModal
          entry={state.editingEntry}
          phrases={state.editingPhrases}
          onPhrasesChange={state.setEditingPhrases}
          onSave={state.handleSaveEdit}
          onCancel={state.handleCancelEdit}
        />
      )}
    </>
  );
}
