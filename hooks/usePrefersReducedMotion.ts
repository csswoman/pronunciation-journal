"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.(QUERY).matches;
}

/**
 * Reactive `prefers-reduced-motion`. Needed for SMIL animations, which CSS
 * `motion-reduce:` variants cannot pause.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
