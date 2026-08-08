// Ejecutor de la migración. Toda la lógica de decisión vive en la función
// pura `planSkillModelMigration`; aquí sólo hay I/O.

import { db } from "@/lib/db";
import type { SRSData } from "@/lib/types";
import { planSkillModelMigration } from "./migrate-to-skill-model";
import { toLearningItemRecord } from "./queries";
import type { LearningItem } from "./verification/types";

export interface SkillModelMigrationResult {
  created: number;
  skipped: boolean;
}

/**
 * Idempotente y conservadora: lee lo que ya existe, crea sólo lo que falta y
 * no toca los SRSData de origen. La escritura es transaccional para evitar
 * que una interrupción deje una palabra con sólo parte de sus habilidades.
 */
export async function runSkillModelMigration(
  userId: string | undefined,
  now: Date,
): Promise<SkillModelMigrationResult> {
  if (!userId) return { created: 0, skipped: true };

  const [srsEntries, existing] = await Promise.all([
    db.srsData.where("userId").equals(userId).toArray() as Promise<SRSData[]>,
    db.learningItems.where("userId").equals(userId).toArray() as Promise<LearningItem[]>,
  ]);

  const toCreate = planSkillModelMigration(srsEntries, existing, now);
  if (toCreate.length === 0) return { created: 0, skipped: false };

  const updatedAt = now.toISOString();
  const records = toCreate.map((item) =>
    toLearningItemRecord(item, userId, updatedAt));

  await db.transaction("rw", db.learningItems, async () => {
    await db.learningItems.bulkPut(records);
  });

  return { created: toCreate.length, skipped: false };
}
