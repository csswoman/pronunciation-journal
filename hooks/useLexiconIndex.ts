"use client";

import { useEffect, useState } from "react";
import type { LexiconSearchHit } from "@/lib/lexicon/types";

let cache: LexiconSearchHit[] | null = null;

export function useLexiconIndex(enabled = true) {
  const [index, setIndex] = useState<LexiconSearchHit[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache && enabled);

  useEffect(() => {
    if (!enabled || cache) {
      if (cache) setIndex(cache);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch("/lexicon/index.json")
      .then((r) => r.json())
      .then((categories: Array<{ id: string; name: string }>) =>
        Promise.all(
          categories.map((cat) =>
            fetch(`/lexicon/${cat.id}.json`)
              .then((r) => r.json())
              .then(
                (
                  words: Array<{
                    id: string;
                    word: string;
                    definition: string;
                    pos: string;
                    ipa?: string;
                    translation?: string;
                  }>
                ) =>
                  words.map((w) => ({
                    id: w.id,
                    word: w.word,
                    definition: w.definition,
                    pos: w.pos,
                    ipa: w.ipa,
                    translation: w.translation,
                    categoryId: cat.id,
                    categoryName: cat.name,
                  }))
              )
          )
        )
      )
      .then((arrays) => {
        if (cancelled) return;
        const flat = arrays.flat();
        cache = flat;
        setIndex(flat);
      })
      .catch(() => {
        /* best-effort */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { index, loading };
}
