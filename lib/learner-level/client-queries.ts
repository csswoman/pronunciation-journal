import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { readGuestStudyLevel } from '@/lib/preferences/guest-study-level'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { resolveLearnerLevel, type LearnerLevelResolution } from './core'

type ProfileLevelRow = {
  cefr_level?: string | null
  cefr_level_source?: string | null
  cefr_level_updated_at?: string | null
}

async function loadProfileLevel(userId: string): Promise<{ profile: ProfileLevelRow | null; readFailed: boolean }> {
  const supabase = getSupabaseBrowserClient()
  const current = await supabase
    .from('user_profiles')
    .select('cefr_level, cefr_level_source, cefr_level_updated_at')
    .eq('id', userId)
    .maybeSingle()
  return { profile: current.data, readFailed: Boolean(current.error) }
}

export async function getEffectiveLearnerLevel(userId: string): Promise<LearnerLevelResolution> {
  const profileResult = await loadProfileLevel(userId).catch(() => ({ profile: null, readFailed: true }))

  return resolveLearnerLevel({
    profileLevel: profileResult.profile?.cefr_level,
    profileSource: profileResult.profile?.cefr_level_source,
    profileUpdatedAt: profileResult.profile?.cefr_level_updated_at,
    readFailed: profileResult.readFailed,
  })
}

export async function getEffectiveLearnerLevelForViewer(
  userId: string | null,
  guestLevel?: string,
): Promise<LearnerLevelResolution> {
  if (userId) return getEffectiveLearnerLevel(userId)
  return {
    level: normalizeCEFR(guestLevel ?? readGuestStudyLevel()),
    source: 'manual',
    confidence: null,
    isPlaced: false,
    updatedAt: null,
  }
}
