import type { SRSData, SrsStatus } from "@/lib/types";

export function addDaysIso(from: Date, days: number): string {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function effectiveStatus(entry: SRSData): SrsStatus {
  if (entry.status) return entry.status;
  if (entry.archived) return "snoozed";
  return "active";
}

export function patchSnooze(entry: SRSData, now: Date, days = 90): SRSData {
  return {
    ...entry,
    status: "snoozed",
    snoozedAt: now.toISOString(),
    nextReview: addDaysIso(now, days),
    archived: undefined,
    archivedAt: undefined,
  };
}

export function patchMaster(entry: SRSData, now: Date): SRSData {
  return {
    ...entry,
    status: "mastered",
    masteredAt: now.toISOString(),
    archived: undefined,
    archivedAt: undefined,
  };
}

export function patchActivateNow(entry: SRSData, now: Date): SRSData {
  return {
    ...entry,
    status: "active",
    nextReview: now.toISOString(),
    snoozedAt: undefined,
    archived: undefined,
    archivedAt: undefined,
  };
}

/** After expired-snooze activation pass, use this for due filtering. */
export function isDueForQueue(entry: SRSData, now: Date): boolean {
  const status = effectiveStatus(entry);
  if (status === "mastered" || status === "snoozed") return false;
  return new Date(entry.nextReview).getTime() <= now.getTime();
}
