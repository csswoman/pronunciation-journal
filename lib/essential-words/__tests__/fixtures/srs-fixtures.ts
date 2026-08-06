import type { SRSData } from "@/lib/types";

/** Palabra nunca repasada correctamente: repetitions 0, vence ya. */
export const srsNew = (word = "on"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.5,
  interval: 0,
  repetitions: 0,
  nextReview: "2026-08-06T00:00:00.000Z",
});

/** Palabra con historial SM-2 pero sin campos FSRS (pre-Fase C). */
export const srsLegacySm2 = (word = "the"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.36,
  interval: 12,
  repetitions: 4,
  nextReview: "2026-08-18T00:00:00.000Z",
  lastReview: "2026-08-06T00:00:00.000Z",
});

/** Palabra ya migrada a FSRS: tiene stability/difficulty/state. */
export const srsFsrs = (word = "not"): SRSData => ({
  wordId: `c1k:${word}`,
  word,
  ease: 2.5,
  interval: 21,
  repetitions: 6,
  nextReview: "2026-08-27T00:00:00.000Z",
  lastReview: "2026-08-06T00:00:00.000Z",
  stability: 21.4,
  difficulty: 5.2,
  state: "Review",
  fsrsRealReviews: 3,
});

/** Conjunto que cubre los tres casos de la migración (§1.12 de la spec). */
export const srsMigrationSet = (): SRSData[] => [srsNew(), srsLegacySm2(), srsFsrs()];
