/**
 * Browser query layer for pronunciation diagnostic rows.
 * Hydrates the Dexie mirror from Supabase when local evidence is missing
 * (e.g. guest claim cleared localStorage, or assessment completed on another device).
 */

import { db } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  getLocalPronunciationAssessments,
  mirrorSyncedPronunciationAssessment,
  PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION,
} from './persistence'
import { validateDiagnosticResult } from './schema'

/**
 * Pulls the latest remote diagnostic into Dexie when the local mirror is empty.
 * No-ops when a local row already exists (offline-first: local wins).
 */
export async function hydratePronunciationAssessments(userId: string): Promise<void> {
  const local = await getLocalPronunciationAssessments(userId)
  if (local.length > 0) return

  const { data, error } = await getSupabaseBrowserClient()
    .from('pronunciation_assessments')
    .select('id, result, schema_version, completed_at, created_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return

  const validated = validateDiagnosticResult(data.result)
  if (!validated.ok) return

  const existing = await db.pronunciationAssessments.get(data.id)
  if (existing) return

  await mirrorSyncedPronunciationAssessment(
    userId,
    validated.result,
    data.id,
    data.schema_version ?? PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION
  )
}
