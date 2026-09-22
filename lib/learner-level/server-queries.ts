import { createSupabaseServerClient } from '@/lib/supabase/server'
import { resolveLearnerLevel, type LearnerLevelResolution } from './core'

type ProfileLevelRow = {
  cefr_level?: string | null
  cefr_level_source?: string | null
  cefr_level_updated_at?: string | null
}

async function loadProfileLevel(userId: string): Promise<{ profile: ProfileLevelRow | null; readFailed: boolean }> {
  const supabase = await createSupabaseServerClient()
  const current = await supabase
    .from('user_profiles')
    .select('cefr_level, cefr_level_source, cefr_level_updated_at')
    .eq('id', userId)
    .maybeSingle()
  return { profile: current.data as ProfileLevelRow | null, readFailed: Boolean(current.error) }
}

export async function getEffectiveLearnerLevelServer(userId: string): Promise<LearnerLevelResolution> {
  const profileResult = await loadProfileLevel(userId).catch(() => ({ profile: null, readFailed: true }))

  return resolveLearnerLevel({
    profileLevel: profileResult.profile?.cefr_level,
    profileSource: profileResult.profile?.cefr_level_source,
    profileUpdatedAt: profileResult.profile?.cefr_level_updated_at,
    readFailed: profileResult.readFailed,
  })
}
