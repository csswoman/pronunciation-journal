"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DeckCard, DECK_ICONS, DECK_PATTERNS, type DeckPattern } from "./components/DeckCard";
import { StudyModal } from "./components/StudyModal";
import { ManageDrawer } from "./components/ManageDrawer";
import { Plus, X } from "lucide-react";
import Container from "@/components/layout/Container";
import Section from "@/components/layout/Section";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/layout/Card";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#06b6d4",
];

const PATTERN_LABELS: Record<DeckPattern, string> = {
  none: "None",
  dots: "Dots",
  grid: "Grid",
  waves: "Waves",
  diagonal: "Lines",
};

// ── Create Deck Modal ──────────────────────────────────────────────────────────

const BG_PATTERNS_PREVIEW: Record<DeckPattern, string> = {
  none: "",
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1.5' fill='white' fill-opacity='0.15'/%3E%3C/svg%3E")`,
  grid: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 L 0 0 0 20' fill='none' stroke='white' stroke-opacity='0.12' stroke-width='1'/%3E%3C/svg%3E")`,
  waves: `url("data:image/svg+xml,%3Csvg width='40' height='20' viewBox='0 0 40 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 C10 0, 30 0, 40 10 C30 20, 10 20, 0 10Z' fill='white' fill-opacity='0.08'/%3E%3C/svg%3E")`,
  diagonal: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='20' x2='20' y2='0' stroke='white' stroke-opacity='0.12' stroke-width='1.5'/%3E%3C/svg%3E")`,
};

function buildDescription(icon: string, pattern: DeckPattern, description: string): string | null {
  const hasIcon = DECK_ICONS.includes(icon);
  const hasPattern = pattern !== "none";
  const hasDesc = description.trim() !== "";
  if (!hasIcon && !hasPattern && !hasDesc) return null;
  if (!hasIcon && !hasPattern) return description.trim();
  const meta = `__meta:icon=${icon},pattern=${pattern}__`;
  return hasDesc ? `${meta}|${description.trim()}` : meta;
}

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
  const [icon, setIcon] = useState(DECK_ICONS[0]);
  const [pattern, setPattern] = useState<DeckPattern>("none");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);
    setError("");
    const supabase = getSupabaseBrowserClient();
    const encodedDescription = buildDescription(icon, pattern, description);
    const { data, error: err } = await supabase
      .from("decks")
      .insert({ name: name.trim(), description: encodedDescription, color, user_id: user.id })
      .select()
      .single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[var(--card-bg)] rounded-2xl border border-[var(--line-divider)] shadow-xl overflow-hidden">

        {/* Preview header */}
        <div
          className="h-20 flex items-end px-4 pb-3 relative"
          style={{ background: color, backgroundImage: BG_PATTERNS_PREVIEW[pattern] }}
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl leading-none">
            {icon}
          </div>
          <span className="ml-3 font-semibold text-white text-base truncate flex-1">
            {name || "Deck name…"}
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[var(--deep-text)]">New Deck</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--btn-plain-bg-hover)] text-[var(--text-tertiary)]">
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3">
            {/* Name */}
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Name</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="e.g. Travel Vocabulary"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest">Description (optional)</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this deck about?"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-divider)] text-sm text-[var(--deep-text)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/40"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 block">Icon</label>
              <div className="flex gap-1.5 flex-wrap">
                {DECK_ICONS.map(ic => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                      icon === ic
                        ? "ring-2 ring-[var(--primary)] bg-[var(--btn-plain-bg-hover)] scale-110"
                        : "hover:bg-[var(--btn-plain-bg-hover)] hover:scale-105"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 block">Color</label>
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

            {/* Pattern */}
            <div>
              <label className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-2 block">Background</label>
              <div className="flex gap-2 flex-wrap">
                {DECK_PATTERNS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPattern(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      pattern === p
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--btn-regular-bg)] text-[var(--text-secondary)] hover:bg-[var(--btn-plain-bg-hover)]"
                    }`}
                  >
                    {PATTERN_LABELS[p]}
                  </button>
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
    <div className="py-8 pb-24">
      <Container>
        <PageHeader
          badge="Vocabulary Builder"
          title="Decks"
          subtitle="Study by Topic"
          description="Build word sets and review them fast."
          primaryCta={{
            label: "New Deck",
            icon: <Plus size={16} />,
            onClick: () => setShowCreate(true),
          }}
          illustration={
            <Image
              src="/illustrations/options.svg"
              alt="Deck options illustration"
              width={643}
              height={349}
              priority
              className="w-[300px] xl:w-[340px] h-auto"
            />
          }
        />
      </Container>

      <Container>
        <Section spacing="lg" className="mt-8">

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-36 rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>
                  <div />
                </Card>
              ))}
            </div>
          ) : decks.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: 'var(--btn-regular-bg)' }}>
                  📚
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--deep-text)' }}>No decks yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Create your first deck to organize vocabulary by theme.</p>
                </div>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition-colors mt-2"
                >
                  <Plus size={16} />
                  Create a deck
                </button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
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
        </Section>
      </Container>

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
