import 'server-only'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizeInterests, type Interest } from '@/lib/users/interests'

export async function getUserInterests(userId: string): Promise<Interest[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('interests')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return normalizeInterests(Array.isArray(data?.interests) ? data.interests : [])
}
