import {
  db,
  type EssentialWordProgressRecord,
  type EssentialWordSessionDraftRecord,
} from '@/lib/db'
import type { ExerciseResult } from '@/lib/practice/types'
import type { ActionSessionState } from './action-session'
import type { EssentialWordsSessionSummary } from './session-model'
import type { CefrLevel, EssentialWordPos } from './types'
import type { SessionSizeId } from './session-size'

export const ESSENTIAL_WORDS_DRAFT_VERSION = 1 as const
export const ESSENTIAL_WORDS_DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

export interface EssentialWordsSessionDraft {
  userId: string
  version: typeof ESSENTIAL_WORDS_DRAFT_VERSION
  sessionId: string
  source: 'legacy' | 'skill'
  sizeId: SessionSizeId
  routeId: string | null
  levels: CefrLevel[] | null
  pos: EssentialWordPos[] | null
  plan: ActionSessionState
  results: ExerciseResult[]
  progress: EssentialWordProgressRecord[]
  summary: EssentialWordsSessionSummary | null
  activeElapsedMs: number
  createdAt: string
  updatedAt: string
}

function validActionState(value: unknown): value is ActionSessionState {
  if (!value || typeof value !== 'object') return false
  const state = value as Partial<ActionSessionState>
  return Number.isInteger(state.actionBudget)
    && Number.isInteger(state.completedActions)
    && Array.isArray(state.pending)
    && Array.isArray(state.reserve)
    && Array.isArray(state.claimedKnownWordIds)
}

function decode(record: EssentialWordSessionDraftRecord): EssentialWordsSessionDraft | null {
  if (record.version !== ESSENTIAL_WORDS_DRAFT_VERSION || !validActionState(record.plan)) return null
  if (!Array.isArray(record.results) || !Array.isArray(record.progress)) return null
  return {
    ...record,
    levels: record.levels as CefrLevel[] | null,
    pos: record.pos as EssentialWordPos[] | null,
    plan: record.plan,
    results: record.results as ExerciseResult[],
    progress: record.progress as EssentialWordProgressRecord[],
  }
}

export async function loadEssentialWordsSessionDraft(
  userId: string,
  now = new Date(),
): Promise<EssentialWordsSessionDraft | null> {
  const record = await db.essentialWordSessionDrafts.get(userId)
  if (!record) return null
  const decoded = decode(record)
  const updatedAt = new Date(record.updatedAt).getTime()
  if (!decoded || !Number.isFinite(updatedAt) || now.getTime() - updatedAt > ESSENTIAL_WORDS_DRAFT_MAX_AGE_MS) {
    await db.essentialWordSessionDrafts.delete(userId)
    return null
  }
  return decoded
}

export async function saveEssentialWordsSessionDraft(
  draft: EssentialWordsSessionDraft,
): Promise<void> {
  await db.essentialWordSessionDrafts.put(draft as EssentialWordSessionDraftRecord)
}

export async function clearEssentialWordsSessionDraft(userId: string): Promise<void> {
  await db.essentialWordSessionDrafts.delete(userId)
}
