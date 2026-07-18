import type { SRSData } from "@/lib/types";
import { effectiveStatus } from "./status";

export type VaultFilter = "all" | "snoozed" | "mastered";

export function sourceLabelFromWordId(wordId: string): string {
  if (wordId.startsWith("c1k:")) return "Palabras esenciales";
  return "SRS";
}

export function isVaultEntry(entry: SRSData): boolean {
  const s = effectiveStatus(entry);
  return s === "snoozed" || s === "mastered";
}

export function filterVaultEntries(
  entries: SRSData[],
  filter: VaultFilter,
  query: string,
): SRSData[] {
  const q = query.trim().toLowerCase();
  return entries
    .filter((e) => {
      const s = effectiveStatus(e);
      if (s !== "snoozed" && s !== "mastered") return false;
      if (filter === "snoozed" && s !== "snoozed") return false;
      if (filter === "mastered" && s !== "mastered") return false;
      if (q && !e.word.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => {
      const sa = effectiveStatus(a);
      const sb = effectiveStatus(b);
      if (sa === "snoozed" && sb === "snoozed") {
        return a.nextReview.localeCompare(b.nextReview);
      }
      if (sa === "mastered" && sb === "mastered") {
        return (b.masteredAt ?? "").localeCompare(a.masteredAt ?? "");
      }
      return sa === "snoozed" ? -1 : 1;
    });
}
