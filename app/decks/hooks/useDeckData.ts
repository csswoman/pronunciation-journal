"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

interface DeckEntry {
  deck_id: string;
  entries: { id: string; sound_id: string | null } | null;
}

interface SoundProgress {
  sound_id: string;
  status: string;
  next_review: string;
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
        .from("user_sound_progress")
        .select("sound_id, status, next_review")
        .eq("user_id", user.id);

      const soundStatusMap = new Map(
        (progressData as SoundProgress[] | null ?? []).map(p => [
          p.sound_id,
          { status: p.status, nextReview: p.next_review },
        ])
      );

      const words: Record<string, number> = {};
      const due: Record<string, number> = {};
      const mastered: Record<string, number> = {};
      const now = new Date();

      (entriesData as DeckEntry[] | null ?? []).forEach(row => {
        words[row.deck_id] = (words[row.deck_id] ?? 0) + 1;
        const soundId = row.entries?.sound_id;
        if (!soundId) return;
        const progress = soundStatusMap.get(soundId);
        if (progress?.status === "mastered") mastered[row.deck_id] = (mastered[row.deck_id] ?? 0) + 1;
        if (progress?.nextReview && new Date(progress.nextReview) <= now) due[row.deck_id] = (due[row.deck_id] ?? 0) + 1;
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
