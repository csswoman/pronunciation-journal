"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

interface DeckEntry {
  deck_id: string;
  entries: { id: string; sound_id: string | null } | null;
}

interface ContrastProgress {
  contrast_id: string;
  total_attempts: number;
  correct_answers: number;
  next_review: string | null;
}

export interface DeckCounts {
  words: Record<string, number>;
  due: Record<string, number>;
  mastered: Record<string, number>;
}

export function useDeckData() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<DeckCounts>({ words: {}, due: {}, mastered: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const supabase = getSupabaseBrowserClient();

      const { data: decksData } = await supabase
        .from("decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setDecks(decksData ?? []);

      const { data: entriesData } = await supabase
        .from("deck_entries")
        .select("deck_id, entries(id, sound_id)");

      const { data: progressData } = await supabase
        .from("user_contrast_progress")
        .select("contrast_id, total_attempts, correct_answers, next_review")
        .eq("user_id", user.id);

      // Aggregate contrast progress by first IPA for mastery/due signals
      const byIpa = new Map<string, { correct: number; total: number; minNextReview: Date | null }>();
      for (const p of (progressData as ContrastProgress[] | null ?? [])) {
        const [ipaA] = p.contrast_id.split("|");
        const prev = byIpa.get(ipaA) ?? { correct: 0, total: 0, minNextReview: null };
        const nr = p.next_review ? new Date(p.next_review) : null;
        byIpa.set(ipaA, {
          correct: prev.correct + p.correct_answers,
          total: prev.total + p.total_attempts,
          minNextReview: nr && (!prev.minNextReview || nr < prev.minNextReview) ? nr : prev.minNextReview,
        });
      }

      // We need sound IPA to map from sound_id — fetch sounds referenced by entries
      const soundIds = [...new Set(
        (entriesData as DeckEntry[] | null ?? [])
          .map(r => r.entries?.sound_id)
          .filter((id): id is string => id != null)
      )];
      const soundIpaMap = new Map<string, string>();
      if (soundIds.length > 0) {
        const { data: soundRows } = await supabase
          .from("sounds")
          .select("id, ipa")
          .in("id", soundIds.map(Number));
        for (const s of soundRows ?? []) soundIpaMap.set(String(s.id), s.ipa ?? "");
      }

      const words: Record<string, number> = {};
      const due: Record<string, number> = {};
      const mastered: Record<string, number> = {};
      const now = new Date();

      (entriesData as DeckEntry[] | null ?? []).forEach(row => {
        words[row.deck_id] = (words[row.deck_id] ?? 0) + 1;
        const soundId = row.entries?.sound_id;
        if (!soundId) return;
        const ipa = soundIpaMap.get(soundId);
        if (!ipa) return;
        const progress = byIpa.get(ipa);
        if (!progress) return;
        const accuracy = progress.total > 0 ? progress.correct / progress.total : 0;
        if (accuracy >= 0.85 && progress.total >= 10) mastered[row.deck_id] = (mastered[row.deck_id] ?? 0) + 1;
        if (progress.minNextReview && progress.minNextReview <= now) due[row.deck_id] = (due[row.deck_id] ?? 0) + 1;
      });

      setCounts({ words, due, mastered });
      setLoading(false);
    };
    load();
  }, [user]);

  const updateDeck = (updated: Deck) =>
    setDecks(prev => prev.map(d => d.id === updated.id ? updated : d));

  const addDeck = (deck: Deck) => {
    setDecks(prev => [deck, ...prev]);
    setCounts(prev => ({ ...prev, words: { ...prev.words, [deck.id]: 0 } }));
  };

  const removeDeck = (id: string) => {
    setDecks(prev => prev.filter(d => d.id !== id));
    setCounts(prev => {
      const words = { ...prev.words };
      const due = { ...prev.due };
      const mastered = { ...prev.mastered };
      delete words[id]; delete due[id]; delete mastered[id];
      return { words, due, mastered };
    });
  };

  const setWordCount = (deckId: string, count: number) =>
    setCounts(prev => ({ ...prev, words: { ...prev.words, [deckId]: count } }));

  return { decks, counts, loading, updateDeck, addDeck, removeDeck, setWordCount };
}
