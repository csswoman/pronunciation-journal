import type { FilterType } from "./data";

// Phonetic matrix (IPA chart layout).
// Vowels: tongue height (rows) × tongue position (columns).
// Consonants: manner (rows) × place of articulation (columns).
// Diphthongs: movement direction (rows) × starting position (columns).

export type VowelHeight = "close" | "near-close" | "close-mid" | "mid" | "open-mid" | "near-open" | "open";
export type VowelPosition = "front" | "central" | "back";

export type ConsonantManner =
  | "plosive"
  | "fricative"
  | "affricate"
  | "nasal"
  | "approximant"
  | "lateral";
export type ConsonantPlace =
  | "bilabial"
  | "labiodental"
  | "dental"
  | "alveolar"
  | "postalveolar"
  | "palatal"
  | "velar"
  | "glottal";

export type DiphthongMovement = "closing";
export type DiphthongStart = "front" | "central" | "back";

export const VOWEL_ROWS: { id: VowelHeight; label: string }[] = [
  { id: "close", label: "Close" },
  { id: "near-close", label: "Near-close" },
  { id: "close-mid", label: "Close-mid" },
  { id: "mid", label: "Mid" },
  { id: "open-mid", label: "Open-mid" },
  { id: "near-open", label: "Near-open" },
  { id: "open", label: "Open" },
];

export const VOWEL_COLS: { id: VowelPosition; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "central", label: "Central" },
  { id: "back", label: "Back" },
];

export const CONSONANT_ROWS: { id: ConsonantManner; label: string }[] = [
  { id: "plosive", label: "Plosivas" },
  { id: "fricative", label: "Fricativas" },
  { id: "affricate", label: "Africadas" },
  { id: "nasal", label: "Nasales" },
  { id: "approximant", label: "Aproximantes" },
  { id: "lateral", label: "Laterales" },
];

/** Orden de columnas (lugar) dentro de cada grupo de consonantes. */
export const CONSONANT_PLACE_ORDER: Record<ConsonantPlace, number> = {
  bilabial: 0,
  labiodental: 1,
  dental: 2,
  alveolar: 3,
  postalveolar: 4,
  palatal: 5,
  velar: 6,
  glottal: 7,
};

export const CONSONANT_COLS: { id: ConsonantPlace; label: string }[] = [
  { id: "bilabial", label: "Bilabial" },
  { id: "labiodental", label: "Labio." },
  { id: "dental", label: "Dental" },
  { id: "alveolar", label: "Alveolar" },
  { id: "postalveolar", label: "Post-alv." },
  { id: "palatal", label: "Palatal" },
  { id: "velar", label: "Velar" },
  { id: "glottal", label: "Glottal" },
];

export const DIPHTHONG_ROWS: { id: DiphthongMovement; label: string }[] = [
  { id: "closing", label: "Closing" },
];

export const DIPHTHONG_COLS: { id: DiphthongStart; label: string }[] = [
  { id: "front", label: "Front start" },
  { id: "central", label: "Central start" },
  { id: "back", label: "Back start" },
];

interface MatrixCoord {
  row: string;
  col: string;
  /** Short word shown under the symbol in the matrix card. */
  keyword: string;
}

/** Each phoneme's position in its category matrix. */
export const PHONEME_MATRIX: Record<string, MatrixCoord> = {
  "/iː/": { row: "close", col: "front", keyword: "see" },
  "/uː/": { row: "close", col: "back", keyword: "moon" },
  "/ɪ/": { row: "near-close", col: "front", keyword: "sit" },
  "/ʊ/": { row: "near-close", col: "back", keyword: "book" },
  "/ɛ/": { row: "open-mid", col: "front", keyword: "bed" },
  "/ə/": { row: "mid", col: "central", keyword: "about" },
  "/ɜr/": { row: "open-mid", col: "central", keyword: "bird" },
  "/ɔ/": { row: "open-mid", col: "back", keyword: "law" },
  "/ʌ/": { row: "open-mid", col: "back", keyword: "cup" },
  "/æ/": { row: "near-open", col: "front", keyword: "cat" },
  "/ɑ/": { row: "open", col: "back", keyword: "hot" },

  "/p/": { row: "plosive", col: "bilabial", keyword: "pen" },
  "/b/": { row: "plosive", col: "bilabial", keyword: "bed" },
  "/t/": { row: "plosive", col: "alveolar", keyword: "ten" },
  "/d/": { row: "plosive", col: "alveolar", keyword: "dog" },
  "/k/": { row: "plosive", col: "velar", keyword: "cat" },
  "/g/": { row: "plosive", col: "velar", keyword: "go" },
  "/f/": { row: "fricative", col: "labiodental", keyword: "fan" },
  "/v/": { row: "fricative", col: "labiodental", keyword: "van" },
  "/θ/": { row: "fricative", col: "dental", keyword: "thin" },
  "/ð/": { row: "fricative", col: "dental", keyword: "this" },
  "/s/": { row: "fricative", col: "alveolar", keyword: "see" },
  "/z/": { row: "fricative", col: "alveolar", keyword: "zoo" },
  "/ʃ/": { row: "fricative", col: "postalveolar", keyword: "she" },
  "/ʒ/": { row: "fricative", col: "postalveolar", keyword: "Asia" },
  "/h/": { row: "fricative", col: "glottal", keyword: "hat" },
  "/tʃ/": { row: "affricate", col: "postalveolar", keyword: "chip" },
  "/dʒ/": { row: "affricate", col: "postalveolar", keyword: "joy" },
  "/m/": { row: "nasal", col: "bilabial", keyword: "man" },
  "/n/": { row: "nasal", col: "alveolar", keyword: "no" },
  "/ŋ/": { row: "nasal", col: "velar", keyword: "sing" },
  "/l/": { row: "lateral", col: "alveolar", keyword: "leg" },
  "/r/": { row: "approximant", col: "postalveolar", keyword: "red" },
  "/j/": { row: "approximant", col: "palatal", keyword: "yes" },
  "/w/": { row: "approximant", col: "bilabial", keyword: "wet" },

  "/eɪ/": { row: "closing", col: "front", keyword: "day" },
  "/aɪ/": { row: "closing", col: "front", keyword: "time" },
  "/ɔɪ/": { row: "closing", col: "back", keyword: "boy" },
  "/oʊ/": { row: "closing", col: "back", keyword: "go" },
  "/aʊ/": { row: "closing", col: "back", keyword: "now" },
};

/** Diphthong glide path inside the vowel trapezoid (normalized 0..1). */
export interface DiphthongGlide {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export const DIPHTHONG_GLIDES: Record<string, DiphthongGlide> = {
  "/eɪ/": { start: { x: 0.18, y: 0.35 }, end: { x: 0.22, y: 0.18 } },
  "/aɪ/": { start: { x: 0.30, y: 0.92 }, end: { x: 0.22, y: 0.18 } },
  "/ɔɪ/": { start: { x: 0.82, y: 0.55 }, end: { x: 0.22, y: 0.18 } },
  "/aʊ/": { start: { x: 0.32, y: 0.92 }, end: { x: 0.78, y: 0.18 } },
  "/oʊ/": { start: { x: 0.78, y: 0.40 }, end: { x: 0.78, y: 0.18 } },
};

/** Get the matrix rows/cols + getter for a given category filter. */
export function getMatrixConfig(type: Exclude<FilterType, "all"> | "vowel") {
  switch (type) {
    case "vowel":
      return { rows: VOWEL_ROWS, cols: VOWEL_COLS, axisLabel: "Tongue position — front to back, close to open" };
    case "consonant":
      return {
        rows: CONSONANT_ROWS,
        cols: CONSONANT_COLS,
        axisLabel: "Agrupadas por modo de articulación",
      };
    case "diphthong":
      return { rows: DIPHTHONG_ROWS, cols: DIPHTHONG_COLS, axisLabel: "Movement direction × starting position" };
  }
}
