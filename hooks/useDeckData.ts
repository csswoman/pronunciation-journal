"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getDeckCounts,
  getUserDecksFull,
  type DeckCounts,
} from "@/lib/decks/queries";
import type { Tables } from "@/lib/supabase/types";

type Deck = Tables<"decks">;

export type { DeckCounts };

export function useDeckData() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [counts, setCounts] = useState<DeckCounts>({ words: {}, due: {}, mastered: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    void (async () => {
      const [decksData, countsData] = await Promise.all([
        getUserDecksFull(user.id),
        getDeckCounts(user.id),
      ]);

      if (cancelled) return;

      setDecks(decksData);
      setCounts(countsData);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateDeck = (updated: Deck) =>
    setDecks((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

  const addDeck = (deck: Deck) => {
    setDecks((prev) => [deck, ...prev]);
    setCounts((prev) => ({ ...prev, words: { ...prev.words, [deck.id]: 0 } }));
  };

  const removeDeck = (id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setCounts((prev) => {
      const words = { ...prev.words };
      const due = { ...prev.due };
      const mastered = { ...prev.mastered };
      delete words[id];
      delete due[id];
      delete mastered[id];
      return { words, due, mastered };
    });
  };

  const setWordCount = (deckId: string, count: number) =>
    setCounts((prev) => ({ ...prev, words: { ...prev.words, [deckId]: count } }));

  return { decks, counts, loading, updateDeck, addDeck, removeDeck, setWordCount };
}
