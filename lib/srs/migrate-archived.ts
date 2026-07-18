import type { SRSData } from "@/lib/types";
import { addDaysIso } from "./status";

export function migrateArchivedRow(entry: SRSData): SRSData {
  if (entry.status) return entry;
  if (!entry.archived) return entry;
  const snoozedAt = entry.archivedAt ?? new Date().toISOString();
  return {
    ...entry,
    status: "snoozed",
    snoozedAt,
    nextReview: addDaysIso(new Date(snoozedAt), 90),
  };
}
