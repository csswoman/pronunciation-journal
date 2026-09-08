"use client";

import { cancelSpeech, speakText } from "./synthesis";

/**
 * `window.speechSynthesis` is a single global channel: `speak()` cancels
 * whatever was already talking. Components that each held their own
 * `isSpeaking` boolean could not see that, so a bubble whose audio had been
 * cut by another one stayed stuck showing "Detener" forever.
 *
 * This registry owns the one-at-a-time truth. Callers claim playback under an
 * `ownerId`; whoever is displaced is told via its subscription, so exactly one
 * owner reports itself as speaking at any moment.
 */

type Listener = (speakingOwnerId: string | null) => void;

const listeners = new Set<Listener>();
let currentOwnerId: string | null = null;

function setOwner(ownerId: string | null): void {
  if (currentOwnerId === ownerId) return;
  currentOwnerId = ownerId;
  for (const listener of listeners) listener(currentOwnerId);
}

export function subscribeToPlayback(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSpeakingOwnerId(): string | null {
  return currentOwnerId;
}

export function isPlaybackAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Starts `text` under `ownerId`, displacing any current speaker. A no-op when
 * synthesis is unavailable or the text is blank, so callers need no guard.
 */
export function requestPlayback(ownerId: string, text: string, options: { rate?: number; lang?: string } = {}): void {
  if (!isPlaybackAvailable() || !text.trim()) return;

  setOwner(ownerId);
  speakText(text, {
    ...options,
    // `speakText` cancels before speaking, so the displaced owner's `onend`
    // may never fire. Ownership above already moved, which is what clears it.
    onEnd: () => {
      if (currentOwnerId === ownerId) setOwner(null);
    },
    onError: () => {
      if (currentOwnerId === ownerId) setOwner(null);
    },
  });
}

/** Stops playback, but only if `ownerId` still holds it. */
export function releasePlayback(ownerId: string): void {
  if (currentOwnerId !== ownerId) return;
  cancelSpeech();
  setOwner(null);
}

/** Test seam: drops all state without touching the real synthesis queue. */
export function resetPlaybackRegistry(): void {
  currentOwnerId = null;
  listeners.clear();
}
