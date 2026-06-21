"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getDeckEntries,
  findEntryByWord,
  insertEntry,
  findDeckEntry,
  insertDeckEntry,
  removeDeckEntry,
  removeDeckEntries,
  getEntryMeanings,
  updateEntryContent,
} from "@/lib/decks/queries";
import type { Tables } from "@/lib/supabase/types";
import { BookOpen, Plus, Sparkles, X } from "lucide-react";
import Button from "@/components/ui/Button";
import { H2 } from "@/components/ui/Typography";
import { fetchMeaningForWord } from "@/lib/word-bank/meaning";
import { ManageVocabTab } from "./ManageVocabTab";
import { ManageAddTab } from "./ManageAddTab";
import { ManageAiTab } from "./ManageAiTab";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type Tab = "words" | "add" | "ai";

interface ManageDrawerProps {
  deck: Deck;
  onClose: () => void;
  onWordCountChange?: (count: number) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "words", label: "Words", icon: <BookOpen size={14} /> },
  { id: "add", label: "Add", icon: <Plus size={14} /> },
  { id: "ai", label: "AI Suggest", icon: <Sparkles size={14} /> },
];

export function ManageDrawer({ deck, onClose, onWordCountChange }: ManageDrawerProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [manualWord, setManualWord] = useState("");
  const [manualPhrases, setManualPhrases] = useState("");
  const [addingWord, setAddingWord] = useState(false);
  const [showPhrases, setShowPhrases] = useState(false);
  const [tab, setTab] = useState<Tab>("words");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [mutating, setMutating] = useState(false);
  const selectMode = selected.size > 0;

  const loadEntries = useCallback(async () => {
    try {
      const loaded = await getDeckEntries(deck.id);
      setEntries(loaded);
      onWordCountChange?.(loaded.length);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not load the deck.");
    } finally {
      setLoading(false);
    }
  }, [deck.id, onWordCountChange]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleAddWord = async (wordOverride?: string, meaningOverride?: string) => {
    const word = (wordOverride ?? manualWord).trim();
    if (!word || !user) return;
    setAddingWord(true);
    setActionError(null);
    try {
      const existing = await findEntryByWord(user.id, word);
      let entryId = existing?.id;
      if (!entryId) {
        const phrases = manualPhrases.trim() ? manualPhrases.split("\n").map((phrase) => phrase.trim()).filter(Boolean) : null;
        const resolvedMeaning = meaningOverride ?? (await fetchMeaningForWord(word));
        const meanings = resolvedMeaning ? [{ definitions: [{ definition: resolvedMeaning }] }] : null;
        const newEntry = await insertEntry({ word, userId: user.id, difficulty: 1, phrases, meanings, id: crypto.randomUUID() });
        entryId = newEntry?.id;
      }
      if (entryId) {
        const existingDeckEntry = await findDeckEntry(deck.id, entryId);
        if (!existingDeckEntry) {
          await insertDeckEntry(deck.id, entryId);
        }
        setManualWord("");
        setManualPhrases("");
        await loadEntries();
      }
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "Could not add the word.");
    } finally {
      setAddingWord(false);
    }
  };

  const handleRemoveWord = async (entryId: string) => {
    if (mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await removeDeckEntry(deck.id, entryId);
      setSelected((previous) => {
        const next = new Set(previous);
        next.delete(entryId);
        return next;
      });
      await loadEntries();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not remove the word.");
    } finally {
      setMutating(false);
    }
  };

  const handleBulkRemove = async () => {
    if (selected.size === 0 || mutating) return;
    setMutating(true);
    setActionError(null);
    try {
      await removeDeckEntries(deck.id, Array.from(selected));
      setSelected(new Set());
      await loadEntries();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not remove the selected words.");
    } finally {
      setMutating(false);
    }
  };

  const handleSaveEntry = async (entryId: string, phrases: string[], meaning: string) => {
    setActionError(null);
    try {
      const { meanings: rawMeanings } = await getEntryMeanings(entryId);
      const existingMeanings = Array.isArray(rawMeanings) ? (rawMeanings as { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] }[]) : [];
      let meanings: { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] }[] | null = existingMeanings.length ? existingMeanings : null;
      if (meaning) {
        if (existingMeanings.length > 0) {
          const updated = [...existingMeanings];
          updated[0] = { ...updated[0], definitions: [{ ...(updated[0].definitions?.[0] ?? {}), definition: meaning }] };
          meanings = updated;
        } else {
          meanings = [{ definitions: [{ definition: meaning }] }];
        }
      }
      await updateEntryContent(entryId, { phrases: phrases.length ? phrases : null, meanings });
      await loadEntries();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Could not save the changes.");
      throw error;
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filtered = entries.filter((entry) => entry.word.toLowerCase().includes(filter.toLowerCase()));
    const allFilteredSelected = filtered.length > 0 && filtered.every((entry) => selected.has(entry.id));
    if (allFilteredSelected) {
      setSelected((previous) => {
        const next = new Set(previous);
        filtered.forEach((entry) => next.delete(entry.id));
        return next;
      });
    } else {
      setSelected((previous) => new Set([...Array.from(previous), ...filtered.map((entry) => entry.id)]));
    }
  };

  return <>
    <button type="button" className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm cursor-default" onClick={onClose} aria-label="Close drawer" tabIndex={-1} />
    <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[var(--card-bg)] border-l border-[var(--line-divider)] shadow-2xl">
      <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[var(--line-divider)]">
        <div><H2 className="font-bold text-lg leading-tight">{deck.name}</H2>{deck.description && <p className="text-xs text-fg-muted mt-0.5 line-clamp-1">{deck.description}</p>}<p className="text-xs text-fg-subtle mt-1">{loading ? "..." : `${entries.length} word${entries.length !== 1 ? "s" : ""}`}</p></div>
        <Button variant="ghost" size="icon" onClick={onClose} className="mt-0.5"><X size={18} /></Button>
      </div>

      <div className="flex px-4 pt-3 gap-1 border-b border-[var(--line-divider)] pb-0">{TABS.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors -mb-px ${tab === item.id ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-fg-muted hover:text-fg"}`}>{item.icon}{item.label}</button>)}</div>

      <div className="flex-1 overflow-y-auto">
        {actionError && (
          <div role="alert" className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-xl border border-error bg-error-soft px-3 py-2 text-sm text-error">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} aria-label="Dismiss error">
              ×
            </button>
          </div>
        )}
        {tab === "words" && <ManageVocabTab loading={loading} entries={entries} filter={filter} selected={selected} selectMode={selectMode} onFilterChange={setFilter} onToggleSelectAll={toggleSelectAll} onBulkRemove={handleBulkRemove} onToggleSelect={toggleSelect} onRemoveWord={handleRemoveWord} onSaveEntry={handleSaveEntry} onChangeTab={setTab} />}
        {tab === "add" && <ManageAddTab entries={entries} manualWord={manualWord} manualPhrases={manualPhrases} showPhrases={showPhrases} addingWord={addingWord} onManualWordChange={setManualWord} onManualPhrasesChange={setManualPhrases} onTogglePhrases={() => setShowPhrases((value) => !value)} onAddWord={() => handleAddWord()} />}
        {tab === "ai" && <ManageAiTab deck={deck} entries={entries} onAddEntry={handleAddWord} />}
      </div>
    </div>
  </>;
}
