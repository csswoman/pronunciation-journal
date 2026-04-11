/**
 * Server-side queries for Skill Profile data
 * Uses RPC for efficient aggregation
 * 
 * IMPORTANT: This file has server dependencies. Only use in Server Components.
 * For client-safe utilities, import from './utils' instead.
 */

import { createServerSupabaseClient } from '@/lib/supabase/getUser'
import type { SkillProfile } from './types'
import { getEmptyProfile } from './utils'

/**
 * Fetch complete skill profile for authenticated user
 * Uses RPC: get_skill_profile(user_id)
 * 
 * SERVER-ONLY: Use in Server Components or Server Actions
 */
export async function getSkillProfile(userId: string): Promise<SkillProfile> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.rpc('get_skill_profile', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Failed to fetch skill profile:', error)
    return getEmptyProfile()
  }

  if (!data) {
    return getEmptyProfile()
  }

  return data as SkillProfile
}
