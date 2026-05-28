"use client";

import { useState } from "react";
import { toggleFavorite } from "@/lib/word-bank/queries";

export function useFavorite(initialValue: boolean, wordBankId: string | null) {
  const [isFavorite, setIsFavorite] = useState(initialValue);
  const [pending, setPending] = useState(false);

  const toggle = async () => {
    if (!wordBankId || pending) return;
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    setPending(true);
    try {
      await toggleFavorite(wordBankId, next);
    } catch {
      setIsFavorite(!next); // revert on error
    } finally {
      setPending(false);
    }
  };

  return { isFavorite, toggle, pending };
}
