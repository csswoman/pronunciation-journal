import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";

const STORAGE_KEY = "guest-study-level";

export function readGuestStudyLevel(): CefrLevel {
  if (typeof window === "undefined") return "A1";
  const level = window.localStorage.getItem(STORAGE_KEY);
  return CEFR_LEVELS.includes(level as CefrLevel) ? (level as CefrLevel) : "A1";
}

export function saveGuestStudyLevel(level: CefrLevel): void {
  window.localStorage.setItem(STORAGE_KEY, level);
}
