import { db, ensureDbReady } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { resolveLearnerLevel, type LearnerLevelResolution } from './core'

type ProfileLevelRow = {
  cefr_level?: string | null
  cefr_level_source?: string | null
  cefr_level_updated_at?: string | null
}

async function loadProfileLevel(userId: string): Promise<ProfileLevelRow | null> {
  const supabase = getSupabaseBrowserClient()
  const current = await supabase
    .from('user_profiles')
    .select('cefr_level, cefr_level_source, cefr_level_updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (!current.error) return current.data

  const legacy = await supabase
    .from('user_profiles')
    .select('cefr_level')
    .eq('id', userId)
    .maybeSingle()
  return legacy.error ? null : legacy.data
}

export async function getEffectiveLearnerLevel(userId: string): Promise<LearnerLevelResolution> {
  await ensureDbReady().catch(() => undefined)
  const [profile, local] = await Promise.all([
    loadProfileLevel(userId).catch(() => null),
    db.learningState.get(userId).catch(() => undefined),
  ])

  return resolveLearnerLevel({
    profileLevel: profile?.cefr_level,
    profileSource: profile?.cefr_level_source,
    profileUpdatedAt: profile?.cefr_level_updated_at,
    practiceLevel: local?.state.level.cefrEstimate,
    practiceConfidence: local?.state.level.confidence,
  })
}
