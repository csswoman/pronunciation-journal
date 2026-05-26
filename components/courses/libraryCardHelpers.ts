// Derived/mocked metadata for LibraryItemCard.
// TODO: replace with real fields once duration/CEFR/eyebrow live on the schema.

import type { LibraryItemCoverVariant } from "./LibraryItemCard";

const COVER_HUES = [12, 250, 165, 60, 310, 195, 35];
const VARIANTS: LibraryItemCoverVariant[] = ["gradient", "gradient", "gradient", "diagonals", "grid"];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function getInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "—";
  if (words.length === 1) return words[0].slice(0, 2);
  return (words[0][0] + words[1][0]).slice(0, 3);
}

export function getCoverHue(title: string) {
  return COVER_HUES[hash(title) % COVER_HUES.length];
}

export function getCoverVariant(title: string, inProgress: boolean): LibraryItemCoverVariant {
  if (inProgress) return "gradient";
  return VARIANTS[hash(title) % VARIANTS.length];
}

export function getDurationLabel(lessons: number | undefined): string | undefined {
  if (!lessons || lessons <= 0) return undefined;
  const totalMin = lessons * 20; // mock: ~20 min/lesson
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} m`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m.toString().padStart(2, "0")} m`;
}

const LEVEL_LABEL: Record<string, string> = {
  basic:        "A2 · Elementary",
  beginner:     "A1 · Beginner",
  intermediate: "B1 · Pre-intermediate",
  advanced:     "B2 · Intermediate",
};

export function getLevelLabel(level: string | undefined): string | undefined {
  if (!level) return undefined;
  const key = level.toLowerCase();
  return LEVEL_LABEL[key] ?? key;
}
