"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { GeminiSuggestPanel } from "./GeminiSuggestPanel";
import type { Tables } from "@/lib/supabase/types";
import {
  X, Pencil, Trash2, Volume2, Plus, Search, Sparkles, BookOpen,
  Check, ChevronDown, ChevronUp, Square, CheckSquare, Minus,
} from "lucide-react";

type Deck = Tables<"decks">;
type Entry = Tables<"entries">;
type DeckEntryRow = { entries: Entry | null };

interface ManageDrawerProps {
  deck: Deck;
  onClose: () => void;
  onWordCountChange?: (count: number) => void;
}

type Tab = "words" | "add" | "ai";

async function fetchMeaningForWord(word: string): Promise<string | null> {
  try {
    const res = await fetch("/api/gemini/deck-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deckName: word,
        deckDescription: `Give a single concise definition for the English word "${word}". Return exactly 1 suggestion with the word and its meaning.`,
        existingWords: [],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const first = data.suggestions?.[0];
    return first?.meaning ?? null;
  } catch {
    return null;
  }
}

function speak(word: string) {
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(word);
  utt.lang = "en-US";
  utt.rate = 0.85;
  window.speechSynthesis.speak(utt);
}

function EntryRow({
  entry,
  selected,
  onToggleSelect,
  onRemove,
  onSaveEntry,
  selectMode,
}: {
  entry: Entry;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onSaveEntry: (id: string, phrases: string[], meaning: string) => Promise<void>;
  selectMode: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingPhrases, setEditingPhrases] = useState("");
  const [editingMeaning, setEditingMeaning] = useState("");
  const [saving, setSaving] = useState(false);

  const meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
  const firstMeaning = meanings[0] as { partOfSpeech?: string; definitions?: { definition?: string }[] } | undefined;
  const pos = firstMeaning?.partOfSpeech;
  const currentDefinition = firstMeaning?.definitions?.[0]?.definition ?? "";

  const openEdit = () => {
    setEditingPhrases(entry.phrases ? entry.phrases.join("\n") : "");
    setEditingMeaning(currentDefinition);
    setExpanded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const phrases = editingPhrases.trim()
      ? editingPhrases.split("\n").map(p => p.trim()).filter(Boolean)
      : [];
    await onSaveEntry(entry.id, phrases, editingMeaning.trim());
    setSaving(false);
    setExpanded(false);
  };

  return (
    <div className={`rounded-xl border transition-colors ${
      selected
        ? "border-[var(--primary)] bg-[var(--primary)]/5"
        : "border-transparent hover:border-[var(--line-divider)] hover:bg-[var(--btn-plain-bg-hover)]"
    }`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Checkbox */}
        <button
          onClick={() => onToggleSelect(entry.id)}
          className={`flex-shrink-0 transition-opacity ${selectMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        >
          {selected
            ? <CheckSquare size={16} className="text-[var(--primary)]" />
            : <Square size={16} className="text-[var(--text-tertiary)]" />
          }
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-[var(--deep-text)]">{entry.word}</span>
            {pos && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--line-divider)] text-[var(--text-tertiary)] font-medium">
                {pos}
              </span>
            )}
          </div>
          {entry.ipa && (
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">/{entry.ipa}/</p>
          )}
          {!expanded && currentDefinition && (
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{currentDefinition}</p>
          )}
          {!expanded && entry.phrases && entry.phrases.length > 0 && (
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 italic">
              "{entry.phrases[0]}"{entry.phrases.length > 1 ? ` +${entry.phrases.length - 1}` : ""}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => speak(entry.word)}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--deep-text)] hover:bg-[var(--btn-regular-bg)] transition-colors"
            title="Pronounce"
          >
            <Volume2 size={13} />
          </button>
          <button
            onClick={expanded ? () => setExpanded(false) : openEdit}
            className={`p-1.5 rounded-lg transition-colors ${
              expanded
                ? "text-[var(--primary)] bg-[var(--primary)]/10"
                : "text-[var(--text-tertiary)] hover:text-[var(--deep-text)] hover:bg-[var(--btn-regular-bg)]"
            }`}
            title="Edit phrases"
          >
            {expanded ? <ChevronUp size={13} /> : <Pencil size={13} />}
          </button>
          <button
            onClick={() => onRemove(entry.id)}
            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Remove"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Inline editor */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-[var(--line-divider)] pt-3 mx-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">
              Meaning / definition
            </p>
            <textarea
              autoFocus
              value={editingMeaning}
              onChange={e => setEditingMeaning(e.target.value)}
              placeholder="e.g. the occurrence of events by chance in a happy way"
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
            />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">
              Phrases / examples
            </p>
            <textarea
              value={editingPhrases}
              onChange={e => setEditingPhrases(e.target.value)}
              placeholder={"One phrase per line…\ne.g. a serendipitous meeting"}
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setExpanded(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : <><Check size={12} /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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

  // Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const selectMode = selected.size > 0;

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

  const handleAddWord = async (wordOverride?: string, meaningOverride?: string) => {
    const word = (wordOverride ?? manualWord).trim();
    if (!word || !user) return;
    setAddingWord(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { data: existing } = await supabase.from("entries").select("id, meanings").eq("user_id", user.id).ilike("word", word).maybeSingle();
      let entryId = existing?.id;
      if (!entryId) {
        const phrases = manualPhrases.trim() ? manualPhrases.split("\n").map(p => p.trim()).filter(Boolean) : null;
        // Fetch meaning from AI if not provided (manual add without meaning)
        const resolvedMeaning = meaningOverride ?? (await fetchMeaningForWord(word));
        const meanings = resolvedMeaning
          ? [{ definitions: [{ definition: resolvedMeaning }] }]
          : null;
        const { data: newEntry, error } = await supabase.from("entries").insert({ word, user_id: user.id, difficulty: 1, phrases, meanings, id: crypto.randomUUID() }).select("id").single();
        if (error) throw error;
        entryId = newEntry?.id;
      }
      if (entryId) {
        const { data: existingDE } = await supabase.from("deck_entries").select("*").eq("deck_id", deck.id).eq("entry_id", entryId).maybeSingle();
        if (!existingDE) {
          await supabase.from("deck_entries").insert({ deck_id: deck.id, entry_id: entryId });
        }
        setManualWord("");
        setManualPhrases("");
        await loadEntries();
      }
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown"}`);
    } finally {
      setAddingWord(false);
    }
  };

  const handleRemoveWord = async (entryId: string) => {
    const supabase = getSupabaseBrowserClient();
    await supabase.from("deck_entries").delete().eq("deck_id", deck.id).eq("entry_id", entryId);
    setSelected(prev => { const n = new Set(prev); n.delete(entryId); return n; });
    await loadEntries();
  };

  const handleBulkRemove = async () => {
    if (selected.size === 0) return;
    const supabase = getSupabaseBrowserClient();
    await supabase.from("deck_entries").delete().eq("deck_id", deck.id).in("entry_id", Array.from(selected));
    setSelected(new Set());
    await loadEntries();
  };

  const handleSaveEntry = async (entryId: string, phrases: string[], meaning: string) => {
    const supabase = getSupabaseBrowserClient();
    const { data: current } = await supabase.from("entries").select("meanings").eq("id", entryId).single();
    const existingMeanings = Array.isArray(current?.meanings) ? current.meanings as { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] }[] : [];
    let meanings: { partOfSpeech?: string; definitions?: { definition?: string; example?: string }[] }[] | null = existingMeanings.length ? existingMeanings : null;
    if (meaning) {
      if (existingMeanings.length > 0) {
        // Preserve partOfSpeech and examples, just update the first definition text
        const updated = [...existingMeanings];
        updated[0] = {
          ...updated[0],
          definitions: [{ ...(updated[0].definitions?.[0] ?? {}), definition: meaning }],
        };
        meanings = updated;
      } else {
        meanings = [{ definitions: [{ definition: meaning }] }];
      }
    }
    await supabase.from("entries").update({
      phrases: phrases.length ? phrases : null,
      meanings,
      updated_at: new Date().toISOString(),
    }).eq("id", entryId);
    await loadEntries();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const filtered = entries.filter(e => e.word.toLowerCase().includes(filter.toLowerCase()));
  const allFilteredSelected = filtered.length > 0 && filtered.every(e => selected.has(e.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected(prev => {
        const n = new Set(prev);
        filtered.forEach(e => n.delete(e.id));
        return n;
      });
    } else {
      setSelected(prev => new Set([...Array.from(prev), ...filtered.map(e => e.id)]));
    }
  };

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "words", label: "Words", icon: <BookOpen size={14} /> },
    { id: "add", label: "Add", icon: <Plus size={14} /> },
    { id: "ai", label: "AI Suggest", icon: <Sparkles size={14} /> },
  ];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md flex flex-col bg-[var(--card-bg)] border-l border-[var(--line-divider)] shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-[var(--line-divider)]">
          <div>
            <h2 className="font-bold text-lg text-[var(--deep-text)] leading-tight">{deck.name}</h2>
            {deck.description && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">{deck.description}</p>
            )}
            <p className="text-xs text-[var(--text-tertiary)] mt-1">
              {loading ? "…" : `${entries.length} word${entries.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--btn-regular-bg)] transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-3 gap-1 border-b border-[var(--line-divider)] pb-0">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--deep-text)]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Words tab */}
          {tab === "words" && (
            <div className="p-4 space-y-3">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  placeholder="Search words…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>

              {/* Bulk actions bar */}
              {filtered.length > 0 && !loading && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--deep-text)] transition-colors"
                  >
                    {allFilteredSelected
                      ? <CheckSquare size={14} className="text-[var(--primary)]" />
                      : selected.size > 0
                        ? <Minus size={14} className="text-[var(--text-tertiary)]" />
                        : <Square size={14} />
                    }
                    {allFilteredSelected ? "Deselect all" : "Select all"}
                  </button>

                  {selected.size > 0 && (
                    <button
                      onClick={handleBulkRemove}
                      className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={12} />
                      Remove {selected.size}
                    </button>
                  )}
                </div>
              )}

              {loading ? (
                <div className="space-y-2 pt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-12 rounded-xl bg-[var(--btn-regular-bg)] animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 && entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--btn-regular-bg)] flex items-center justify-center">
                    <BookOpen size={20} className="text-[var(--text-tertiary)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--deep-text)]">No words yet</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Add words manually or use AI suggestions</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setTab("add")} className="text-xs px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90">
                      Add word
                    </button>
                    <button onClick={() => setTab("ai")} className="text-xs px-3 py-1.5 rounded-lg border border-[var(--line-divider)] text-[var(--deep-text)] font-medium hover:bg-[var(--btn-regular-bg)]">
                      AI Suggest
                    </button>
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-xs text-[var(--text-tertiary)] py-8">No matching words</p>
              ) : (
                <div className="space-y-1">
                  {filtered.map(entry => (
                    <EntryRow
                      key={entry.id}
                      entry={entry}
                      selected={selected.has(entry.id)}
                      onToggleSelect={toggleSelect}
                      onRemove={handleRemoveWord}
                      onSaveEntry={handleSaveEntry}
                      selectMode={selectMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add tab */}
          {tab === "add" && (
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] block mb-1.5">Word</label>
                <input
                  value={manualWord}
                  onChange={e => setManualWord(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddWord()}
                  placeholder="e.g. serendipity"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                />
              </div>

              <div>
                <button
                  onClick={() => setShowPhrases(p => !p)}
                  className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--deep-text)] transition-colors mb-2"
                >
                  {showPhrases ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  {showPhrases ? "Hide phrases" : "Add phrases (optional)"}
                </button>
                {showPhrases && (
                  <textarea
                    value={manualPhrases}
                    onChange={e => setManualPhrases(e.target.value)}
                    placeholder={"One phrase per line…\ne.g. a serendipitous encounter"}
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 resize-none"
                  />
                )}
              </div>

              <button
                onClick={() => handleAddWord()}
                disabled={!manualWord.trim() || addingWord}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Plus size={16} />
                {addingWord ? "Adding…" : "Add Word"}
              </button>

              {entries.length > 0 && (
                <div className="pt-2 border-t border-[var(--line-divider)]">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Recently added</p>
                  <div className="space-y-0.5">
                    {entries.slice(-3).reverse().map(entry => (
                      <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                        <span className="text-sm text-[var(--deep-text)] font-medium">{entry.word}</span>
                        {entry.ipa && <span className="text-xs text-[var(--text-tertiary)]">/{entry.ipa}/</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI tab */}
          {tab === "ai" && (
            <div className="p-4">
              <GeminiSuggestPanel
                deck={deck}
                existingWords={entries.map(e => e.word)}
                onAddEntry={handleAddWord}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
