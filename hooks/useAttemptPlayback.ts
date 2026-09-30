"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Reproduce la grabación del propio usuario (blob URL de MediaRecorder).
 * Detiene el audio al cambiar de URL o al desmontar para no solapar intentos.
 */
export function useAttemptPlayback(audioUrl: string | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAttempt = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
  }, []);

  useEffect(() => stopAttempt, [audioUrl, stopAttempt]);

  const playAttempt = useCallback(() => {
    if (!audioUrl) return;
    stopAttempt();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    void audio.play().catch((err) => console.warn("[useAttemptPlayback] play error", err));
  }, [audioUrl, stopAttempt]);

  return { playAttempt, stopAttempt, hasAttempt: audioUrl !== null };
}
