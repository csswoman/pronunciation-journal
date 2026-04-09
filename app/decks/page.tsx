"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DeckCard } from "./components/DeckCard";
import { StudyModal } from "./components/StudyModal";
import { ManageDrawer } from "./components/ManageDrawer";
import { Plus, X } from "lucide-react";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

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
            <X size={20} />
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DecksPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckWordCounts, setDeckWordCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeStudyDeck, setActiveStudyDeck] = useState<string | null>(null);
  const [activeManageDeck, setActiveManageDeck] = useState<string | null>(null);

  // Load decks and word counts
  useEffect(() => {
    if (!user) return;

    const loadDecksAndCounts = async () => {
      const supabase = getSupabaseBrowserClient();

      // Load decks
      const { data: decksData } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setDecks(decksData ?? []);

      // Load word counts via aggregate query
      const { data: entriesData } = await supabase
        .from("deck_entries")
        .select("deck_id, decks!inner(user_id)")
        .eq("decks.user_id", user.id);

      const counts: Record<string, number> = {};
      (entriesData ?? []).forEach((row: { deck_id: string }) => {
        counts[row.deck_id] = (counts[row.deck_id] ?? 0) + 1;
      });

      setDeckWordCounts(counts);
      setLoading(false);
    };

    loadDecksAndCounts();
  }, [user]);

  const handleCreated = (deck: Deck) => {
    setDecks(prev => [deck, ...prev]);
    setDeckWordCounts(prev => ({ ...prev, [deck.id]: 0 }));
    setShowCreate(false);
  };

  const handleDeleted = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    setDeckWordCounts(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const handleWordCountChange = (deckId: string, count: number) => {
    setDeckWordCounts(prev => ({ ...prev, [deckId]: count }));
  };

  const handleDeleteDeck = async (id: string) => {
    const deckName = decks.find(d => d.id === id)?.name;
    if (!confirm(`Delete deck "${deckName}"? This cannot be undone.`)) return;

    const supabase = getSupabaseBrowserClient();
    await supabase.from("decks").delete().eq("id", id);
    handleDeleted(id);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-[var(--deep-text)]">My Decks</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Organize vocabulary by topic. Study with flashcards.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors"
        >
          <Plus size={18} />
          New Deck
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-[var(--btn-regular-bg)] animate-pulse" />
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
            <Plus size={16} />
            Create a deck
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {decks.map(deck => (
            <DeckCard
              key={deck.id}
              deck={deck}
              entryCount={deckWordCounts[deck.id] ?? 0}
              onStudy={() => setActiveStudyDeck(deck.id)}
              onManage={() => setActiveManageDeck(deck.id)}
              onDelete={() => handleDeleteDeck(deck.id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && (
        <CreateDeckModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}

      {activeStudyDeck && (
        <StudyModal
          deck={decks.find(d => d.id === activeStudyDeck)!}
          onClose={() => setActiveStudyDeck(null)}
        />
      )}

      {activeManageDeck && (
        <ManageDrawer
          deck={decks.find(d => d.id === activeManageDeck)!}
          onClose={() => setActiveManageDeck(null)}
          onWordCountChange={count => handleWordCountChange(activeManageDeck, count)}
        />
      )}
    </div>
  );
}
