"use client";

import { useCallback, useEffect, useState } from "react";

/** Browser TTS for short example words (Sound Lab pills, lesson cards). */
export function useSpeakWord() {
  const [speaking, setSpeaking] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((word: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = "en-US";
    utt.rate = 0.9;
    utt.onstart = () => setSpeaking(word);
    utt.onend = () => setSpeaking(null);
    utt.onerror = () => setSpeaking(null);
    window.speechSynthesis.speak(utt);
  }, []);

  return { speaking, speak };
}
