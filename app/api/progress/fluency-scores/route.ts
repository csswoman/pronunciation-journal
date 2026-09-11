import { NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin, requireUser, rateLimit, SECURE_HEADERS, publicErrorResponse } from '@/lib/api/guards'
import { logServerError } from '@/lib/api/logging'
import { getSkillProfileData, getFluencyProfile } from '@/lib/progress/queries'

export const runtime = 'nodejs'

/**
 * Perfil de fluidez de 6 dimensiones para pantallas cliente que no pueden
 * leer Supabase directamente (ej. /focus/setup, offline-first).
 *
 * Reutiliza el mismo cómputo que /progress en vez de reimplementarlo contra
 * Dexie: el radar de Modo Foco y el de Progreso deben decir siempre lo mismo.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const originError = requireSameOrigin(request)
  if (originError) return originError

  const { user, error: authError } = await requireUser(request)
  if (authError) return authError

  const { limited, error: rateLimitError } = await rateLimit(`/api/progress/fluency-scores:${user.id}`, {
    max: 30,
    windowMs: 60_000,
    meta: { endpoint: '/api/progress/fluency-scores', userId: user.id },
  })
  if (limited) return rateLimitError

  try {
    const skillProfile = await getSkillProfileData(user.id)
    const fluencyProfile = await getFluencyProfile(user.id, skillProfile)
    return NextResponse.json(fluencyProfile, { headers: SECURE_HEADERS })
  } catch (err) {
    logServerError('Fluency scores fetch failed', err, {
      endpoint: '/api/progress/fluency-scores',
      operation: 'getFluencyProfile',
      userId: user.id,
    })
    return publicErrorResponse(500, 'Failed to load fluency profile')
  }
}
