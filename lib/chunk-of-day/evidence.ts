import { db, type ChunkEvidenceRecord } from '@/lib/db'
import type { EvidenceModality } from '@/lib/practice/attribution'

export interface ChunkEvidenceReadiness {
  recognitionDays: number
  listeningDays: number
  useDays: number
  pronunciationDays: number
  /** Repeated contextual production on separate days, not exposure or a streak. */
  canSayCanUse: boolean
}

function dayKey(now: string): string {
  return now.slice(0, 10)
}

function fieldForModality(modality: EvidenceModality): keyof Pick<ChunkEvidenceRecord,
  'recognitionDays' | 'listeningDays' | 'useDays' | 'pronunciationDays'> {
  if (modality === 'perception') return 'listeningDays'
  if (modality === 'contextual_use' || modality === 'written_production' || modality === 'spoken_production') return 'useDays'
  if (modality === 'stt_intelligibility') return 'pronunciationDays'
  return 'recognitionDays'
}

/** Records a correct, evaluated chunk attempt without crossing modality boundaries. */
export async function recordChunkEvidence(
  userId: string,
  chunkId: string,
  modality: EvidenceModality,
  now = new Date().toISOString(),
): Promise<void> {
  const id = `${userId}:${chunkId}`
  const field = fieldForModality(modality)
  const current = await db.chunkEvidence.get(id)
  const base: ChunkEvidenceRecord = current ?? {
    id, userId, chunkId,
    recognitionDays: [], listeningDays: [], useDays: [], pronunciationDays: [],
    updatedAt: now,
  }
  const observedDay = dayKey(now)
  const days = base[field].includes(observedDay) ? base[field] : [...base[field], observedDay]
  await db.chunkEvidence.put({ ...base, [field]: days, updatedAt: now })
}

export function deriveChunkEvidenceReadiness(record: ChunkEvidenceRecord | undefined): ChunkEvidenceReadiness {
  const evidence = record ?? {
    recognitionDays: [], listeningDays: [], useDays: [], pronunciationDays: [],
  }
  return {
    recognitionDays: evidence.recognitionDays.length,
    listeningDays: evidence.listeningDays.length,
    useDays: evidence.useDays.length,
    pronunciationDays: evidence.pronunciationDays.length,
    canSayCanUse: evidence.useDays.length >= 2,
  }
}

/** Loads only the selected chunks; absent rows mean no observed evidence yet. */
export async function loadChunkEvidence(
  userId: string,
  chunkIds: readonly string[],
): Promise<Record<string, ChunkEvidenceRecord>> {
  const wanted = new Set(chunkIds)
  const rows = await db.chunkEvidence.where('userId').equals(userId).toArray()
  return Object.fromEntries(rows.filter((row) => wanted.has(row.chunkId)).map((row) => [row.chunkId, row]))
}
