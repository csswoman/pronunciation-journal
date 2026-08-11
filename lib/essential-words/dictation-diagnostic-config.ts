/** Central policy for the diagnostic layer added to sentence dictation. */
export const DICTATION_DIAGNOSTIC_CONFIG = {
  /** A typed word this close to the expected spelling was heard, not missed. */
  maxOrthographyEditDistance: 2,
  /** Presentation-only differences that produce `casi`. */
  nearCorrect: {
    ignoreCase: true,
    ignoreTerminalPunctuation: true,
    ignoreDiacritics: true,
  },
  /** Stable tie-breaker when failed categories have the same count. */
  dominantErrorPriority: ['no_percibida', 'ortografia', 'sobrante'] as const,
  /** Legacy data may seed, but never continue to drive, listening entry level. */
  initialListeningLevel: {
    realListeningAttemptsToRetire: 2,
    // Level 2 (ordering tiles) is intentionally unavailable until its card
    // exists; level 6 is never an entry estimate because it is the strict cap.
    // The 1/3/4/5 seed bands therefore preserve the intended difficulty while
    // the later selector can conservatively fall back to a lower available level.
    strongHistory: { minRepetitions: 12, minStabilityDays: 90, level: 5 },
    establishedHistory: { minRepetitions: 6, minStabilityDays: 30, level: 4 },
    emergingHistory: { minRepetitions: 3, minStabilityDays: 14, level: 3 },
  },
  listeningLadder: {
    minLevel: 1,
    maxLevel: 6,
    consecutiveOutcomesToChangeLevel: 2,
    longLapseDays: 21,
    /** Levels 2–4 rehearse listening with a visible sentence scaffold. */
    availableLevels: [1, 2, 3, 4, 5] as const,
    modeByLevel: {
      1: "recognize_audio",
      2: "listening_cloze_sentence",
      3: "listening_cloze_sentence",
      4: "listening_cloze_sentence",
      5: "dictation_sentence",
    },
  },
} as const
