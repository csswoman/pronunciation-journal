import { db, getCore1000SrsEntries } from "@/lib/db";
import { activateExpiredSnoozes } from "@/lib/srs/status";
import type { SRSData } from "@/lib/types";

export async function prepareCore1000SrsEntries(now = new Date()): Promise<SRSData[]> {
  const srsEntries = await getCore1000SrsEntries();
  const activated = activateExpiredSnoozes(srsEntries, now);
  for (let i = 0; i < activated.length; i++) {
    if (activated[i] !== srsEntries[i]) {
      await db.srsData.put(activated[i]);
    }
  }
  return activated;
}
