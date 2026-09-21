"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  type DeckListItem,
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
import { BookOpen, Plus, Sparkles, X } from "@/components/icons";
import { fetchMeaningForWord } from "@/lib/word-bank/meaning";
import { ManageVocabTab } from "./ManageVocabTab";
import { ManageAddTab } from "./ManageAddTab";
import { ManageAiTab } from "./ManageAiTab";
import { getDeckIconComponent, normalizeDeckTone } from "./deck-palette";
import { cn } from "@/lib/cn";

type Entry = Tables<"entries">;
type Tab = "words" | "add" | "ai";

interface ManageDrawerProps {
  deck: DeckListItem;
  onClose: () => void;
  onWordCountChange?: (count: number) => void;
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "words", label: "Palabras", icon: <BookOpen size={15} /> },
  { id: "add", label: "Agregar", icon: <Plus size={15} /> },
  { id: "ai", label: "Sugerencias IA", icon: <Sparkles size={15} /> },
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

  const tone = normalizeDeckTone(deck.color, deck.name);
  const DeckIconComp = getDeckIconComponent(deck.icon);

  const loadEntries = useCallback(async () => {
    try {
      const loaded = await getDeckEntries(deck.id);
      setEntries(loaded);
      onWordCountChange?.(loaded.length);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo cargar el mazo.");
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
      setActionError(error instanceof Error ? error.message : "No se pudo agregar la palabra.");
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
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar la palabra.");
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
      setActionError(error instanceof Error ? error.message : "No se pudieron eliminar las palabras seleccionadas.");
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
      setActionError(error instanceof Error ? error.message : "No se pudieron guardar los cambios.");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-3xl border border-border-default bg-surface-raised shadow-2xl overflow-hidden select-none">
        {/* Banner de Cabecera con Tono Pastel */}
        <div
          data-tone={tone}
          className="pastel-card relative flex flex-col gap-4 p-6 pb-5 border-b border-ink/10 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-paper text-ink shrink-0 shadow-xs border border-ink/15">
                <DeckIconComp size={22} className="text-ink" />
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-2xl font-extrabold text-ink truncate leading-snug">
                  {deck.name}
                </h2>
                <p className="font-sans text-body-sm font-medium text-ink-secondary truncate">
                  {loading ? "Cargando palabras..." : `${entries.length} palabra${entries.length !== 1 ? "s" : ""} en este mazo`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="focus-ring flex size-9 items-center justify-center rounded-full bg-paper/60 hover:bg-paper text-ink border border-ink/15 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Barra de pestañas segmentada pastel */}
          <div className="flex items-center gap-2 pt-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  "focus-ring inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-sans text-caption transition-all select-none",
                  tab === item.id
                    ? "bg-ink text-paper font-bold shadow-xs scale-105"
                    : "bg-paper/50 hover:bg-paper/80 text-ink border border-ink/15 font-semibold"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Contenido desplazable */}
        <div className="flex-1 overflow-y-auto">
          {actionError && (
            <div role="alert" className="mx-6 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-error bg-error-soft px-4 py-3 text-body-sm text-error">
              <span>{actionError}</span>
              <button type="button" onClick={() => setActionError(null)} aria-label="Descartar error" className="font-bold">
                ×
              </button>
            </div>
          )}
          {tab === "words" && (
            <ManageVocabTab
              loading={loading}
              entries={entries}
              filter={filter}
              selected={selected}
              selectMode={selectMode}
              onFilterChange={setFilter}
              onToggleSelectAll={toggleSelectAll}
              onBulkRemove={handleBulkRemove}
              onToggleSelect={toggleSelect}
              onRemoveWord={handleRemoveWord}
              onSaveEntry={handleSaveEntry}
              onChangeTab={setTab}
            />
          )}
          {tab === "add" && (
            <ManageAddTab
              entries={entries}
              manualWord={manualWord}
              manualPhrases={manualPhrases}
              showPhrases={showPhrases}
              addingWord={addingWord}
              onManualWordChange={setManualWord}
              onManualPhrasesChange={setManualPhrases}
              onTogglePhrases={() => setShowPhrases((value) => !value)}
              onAddWord={() => handleAddWord()}
            />
          )}
          {tab === "ai" && <ManageAiTab deck={deck} entries={entries} onAddEntry={handleAddWord} />}
        </div>
      </div>
    </div>
  );
}

