import { db, getCore1000SrsEntries } from "@/lib/db";
import { activateExpiredSnoozes } from "@/lib/srs/status";
import type { SRSData } from "@/lib/types";

export interface PreparedCore1000Srs {
  entries: SRSData[];
  activatedWordIds: string[];
}

export async function prepareCore1000SrsEntries(now = new Date(), userId?: string): Promise<PreparedCore1000Srs> {
  const srsEntries = await getCore1000SrsEntries(userId);
  const activatedWordIds: string[] = [];
  const activated = activateExpiredSnoozes(srsEntries, now);
  for (let i = 0; i < activated.length; i++) {
    if (activated[i] !== srsEntries[i]) {
      activatedWordIds.push(activated[i].wordId);
      await db.srsData.put({ ...activated[i], userId });
    }
  }
  return { entries: activated, activatedWordIds };
}
