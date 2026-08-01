import { db, getEssentialWordsSrsEntries } from "@/lib/db";
import { activateExpiredSnoozes } from "@/lib/srs/status";
import type { SRSData } from "@/lib/types";

export interface PreparedEssentialWordsSrs {
  entries: SRSData[];
  activatedWordIds: string[];
}

export async function prepareEssentialWordsSrsEntries(now = new Date(), userId?: string): Promise<PreparedEssentialWordsSrs> {
  const srsEntries = await getEssentialWordsSrsEntries(userId);
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
