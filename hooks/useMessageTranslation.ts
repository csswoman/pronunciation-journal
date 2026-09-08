"use client";

import { useCallback, useState } from "react";

export interface UseMessageTranslationOptions {
  /** Prose to translate — the suggestion-stripped body, not the raw turn. */
  text: string;
  /** Persists the translation on the message so it survives a reload. */
  onTranslated?: (translation: string) => void;
  /** Translation already stored on the message, if any. */
  initial?: string;
}

export interface UseMessageTranslationReturn {
  isVisible: boolean;
  isLoading: boolean;
  hasError: boolean;
  translation: string | null;
  /** Show, hide, or (on `retry`) re-fetch regardless of cached state. */
  toggle: (retry?: boolean) => Promise<void>;
}

const GENERIC_FAILURE = "No se pudo obtener la traducción en este momento.";
const EMPTY_RESULT = "No se pudo traducir este mensaje.";
const NETWORK_FAILURE = "Error de conexión al traducir.";

/**
 * Owns one message's translation: fetch, cache, visibility and error state.
 * Lifted out of `AIBubble` so the bubble stays presentational.
 */
export function useMessageTranslation({
  text,
  onTranslated,
  initial,
}: UseMessageTranslationOptions): UseMessageTranslationReturn {
  const [isVisible, setIsVisible] = useState(Boolean(initial));
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [translation, setTranslation] = useState<string | null>(initial ?? null);

  const toggle = useCallback(
    async (retry = false) => {
      if (isVisible && !hasError && !retry) {
        setIsVisible(false);
        return;
      }
      if (translation && !hasError && !retry) {
        setIsVisible(true);
        return;
      }

      setHasError(false);
      setTranslation(null);
      setIsLoading(true);
      setIsVisible(true);

      try {
        const res = await fetch("/api/gemini/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          setTranslation(GENERIC_FAILURE);
          setHasError(true);
          return;
        }

        const data = await res.json();
        const translated = (data.translation || "").trim();
        setTranslation(translated || EMPTY_RESULT);
        setHasError(!translated);
        if (translated) onTranslated?.(translated);
      } catch {
        setTranslation(NETWORK_FAILURE);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [hasError, isVisible, onTranslated, text, translation],
  );

  return { isVisible, isLoading, hasError, translation, toggle };
}
