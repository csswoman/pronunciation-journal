// Pre-graduation intermediate state (spec §4.2/§4.3). Pure resumption logic;
// the Dexie read/write wrapper lives in lib/db/index.ts.

export const RESUMPTION_WINDOW_DAYS = 14;

export interface EssentialWordProgressRecord {
  wordId: string;
  userId: string;
  exposedAt: string;
  highestLevel: 0 | 1 | 2 | 3;
  lastLevelAt: string;
  lastSessionId: string;
  attempts: number;
}

export type ResumptionDecision =
  | { kind: "full_exposure"; archive?: true }
  | { kind: "abbreviated_exposure"; fromLevel: 1 }
  | { kind: "resume_no_exposure"; fromLevel: 1 | 2 | 3 }
  | { kind: "resume_final_round" };

function withinWindow(record: EssentialWordProgressRecord, now: Date): boolean {
  const lastLevelAt = new Date(record.lastLevelAt).getTime();
  const elapsedMs = now.getTime() - lastLevelAt;
  return elapsedMs <= RESUMPTION_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function resumeState(record: EssentialWordProgressRecord, now: Date): ResumptionDecision {
  const inWindow = withinWindow(record, now);

  if (record.highestLevel === 0) {
    return inWindow ? { kind: "abbreviated_exposure", fromLevel: 1 } : { kind: "full_exposure" };
  }

  if (record.highestLevel === 1 || record.highestLevel === 2) {
    if (!inWindow) return { kind: "full_exposure", archive: true };
    return { kind: "resume_no_exposure", fromLevel: (record.highestLevel + 1) as 2 | 3 };
  }

  if (!inWindow) return { kind: "full_exposure", archive: true };
  return { kind: "resume_final_round" };
}
