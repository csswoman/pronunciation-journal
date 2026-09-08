"use client";

import { useCallback, useEffect, useId, useSyncExternalStore } from "react";
import {
  getSpeakingOwnerId,
  isPlaybackAvailable,
  releasePlayback,
  requestPlayback,
  subscribeToPlayback,
} from "@/lib/speech/playback-registry";

export interface UseCoachSpeechOptions {
  text: string;
  /**
   * Stable identity for this utterance. Defaults to a per-instance id, which
   * is enough for one bubble; pass the message key when the same content can
   * be claimed from more than one place.
   */
  ownerId?: string;
}

export interface UseCoachSpeechReturn {
  isSpeaking: boolean;
  isAvailable: boolean;
  toggle: () => void;
  speak: () => void;
  stop: () => void;
}

export function useCoachSpeech({ text, ownerId }: UseCoachSpeechOptions): UseCoachSpeechReturn {
  const fallbackId = useId();
  const id = ownerId ?? fallbackId;

  // Subscribing to the shared registry (rather than holding a local boolean)
  // means a bubble displaced by another one re-renders back to "Escuchar"
  // instead of staying stuck on "Detener".
  const speakingOwnerId = useSyncExternalStore(
    subscribeToPlayback,
    getSpeakingOwnerId,
    () => null,
  );

  const isSpeaking = speakingOwnerId === id;
  const isAvailable = isPlaybackAvailable();

  const stop = useCallback(() => {
    releasePlayback(id);
  }, [id]);

  const speak = useCallback(() => {
    requestPlayback(id, text, { lang: "en-US" });
  }, [id, text]);

  const toggle = useCallback(() => {
    if (isSpeaking) stop();
    else speak();
  }, [isSpeaking, speak, stop]);

  useEffect(() => stop, [stop]);

  return { isSpeaking, isAvailable, toggle, speak, stop };
}
