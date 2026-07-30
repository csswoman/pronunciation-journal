"use client";

import { useCallback, useEffect, useState } from "react";

/** Browser TTS for short example words (Sound Lab pills, lesson cards). */
export function useSpeakWord() {
  const [speaking, setSpeaking] = useState<string | null>(null);
  const available = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (available) window.speechSynthesis.cancel();
    setSpeaking(null);
  }, [available]);

  useEffect(() => {
    return () => {
      if (available) window.speechSynthesis.cancel();
    };
  }, [available]);

  const speak = useCallback((word: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!available) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "en-US";
    utt.rate = 0.9;
    utt.onstart = () => setSpeaking(word);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
  }, [available]);

  return { speaking, speak, stop, available };
}
