import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resolveLearnerLevel, type LearnerLevelResolution } from './core'

type LearningStateLevel = { level?: { cefrEstimate?: string; confidence?: number } }
type ProfileLevelRow = {
  cefr_level?: string | null
  cefr_level_source?: string | null
  cefr_level_updated_at?: string | null
}

async function loadProfileLevel(userId: string): Promise<ProfileLevelRow | null> {
  const supabase = await createSupabaseServerClient()
  const current = await supabase
    .from('user_profiles')
    .select('cefr_level, cefr_level_source, cefr_level_updated_at')
    .eq('id', userId)
    .maybeSingle()
  if (!current.error) return current.data as ProfileLevelRow | null
  const legacy = await supabase.from('user_profiles').select('cefr_level').eq('id', userId).maybeSingle()
  return legacy.error ? null : legacy.data as ProfileLevelRow | null
}

export async function getEffectiveLearnerLevelServer(userId: string): Promise<LearnerLevelResolution> {
  const supabase = await createSupabaseServerClient()
  const [profile, stateResult] = await Promise.all([
    loadProfileLevel(userId),
    supabase.from('user_learning_state').select('state').eq('user_id', userId).maybeSingle(),
  ])
  const state = stateResult.data?.state as LearningStateLevel | null

  return resolveLearnerLevel({
    profileLevel: profile?.cefr_level,
    profileSource: profile?.cefr_level_source,
    profileUpdatedAt: profile?.cefr_level_updated_at,
    practiceLevel: state?.level?.cefrEstimate,
    practiceConfidence: state?.level?.confidence,
  })
}
