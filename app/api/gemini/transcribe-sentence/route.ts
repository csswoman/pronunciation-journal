import { after, NextRequest, NextResponse } from 'next/server'
import { requireSameOrigin, requireUser, checkLayeredRateLimit, publicErrorResponse } from '@/lib/api/guards'
import { SENTENCE_TRANSCRIPTION_PROMPT } from '@/lib/ai-prompts'
import { callWithFallback, getErrorStatus, withGeminiTimeout } from '@/lib/gemini/client'
import { readTranscriptionAudio } from '@/lib/gemini/audio-request'
import { TRANSCRIPTION_PROFILE } from '@/lib/gemini/interactive'
import { createAiTiming } from '@/lib/gemini/timing'
import { logServerError } from '@/lib/api/logging'
import { buildTranscriptionCacheKey, createTranscriptionCache } from '@/lib/gemini/transcription-cache'

const transcriptionCache = createTranscriptionCache({
  table: 'sentence_transcription_cache', ttlMs: 1000 * 60 * 60 * 6, maxEntries: 200,
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const timing = createAiTiming('/api/gemini/transcribe-sentence')
  const originError = requireSameOrigin(request)
  if (originError) return originError
  const { user, error: authError } = await timing.measure('auth', () => requireUser(request))
  if (authError) return authError as NextResponse
  const { limited, error: rateLimitError } = await timing.measure('rateLimit', async () => checkLayeredRateLimit({
    request, user, endpoint: '/api/gemini/transcribe-sentence', maxPermanent: 20, maxAnonymous: 3,
  }))
  if (limited) return rateLimitError as NextResponse
  try {
    const { data: body, error } = await timing.measure('upload', () => readTranscriptionAudio(request, 4_500_000))
    if (error) return error as NextResponse
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
    const { mimeType, base64Data } = body
    const key = buildTranscriptionCacheKey([user.id, mimeType, base64Data])
    const l1 = transcriptionCache.getL1(key)
    if (l1 !== null) return NextResponse.json({ transcript: l1, cached: true }, { headers: timing.headers('l1') })
    const l2 = await timing.measure('cache', () => withGeminiTimeout(transcriptionCache.getL2(user.id, key), 1500).catch(() => null))
    if (l2 !== null) {
      transcriptionCache.setL1(key, l2)
      return NextResponse.json({ transcript: l2, cached: true, source: 'supabase' }, { headers: timing.headers('l2') })
    }
    const transcript = await timing.measure('provider', () => callWithFallback(apiKey, {
      contents: [{ text: SENTENCE_TRANSCRIPTION_PROMPT }, { inlineData: { mimeType, data: base64Data } }],
      config: { temperature: 0, maxOutputTokens: 512 },
    }, text => text.trim(), {
      ...TRANSCRIPTION_PROFILE, allowEmptyText: true, signal: request.signal, feature: '/api/gemini/transcribe-sentence',
    }))
    transcriptionCache.setL1(key, transcript)
    after(() => transcriptionCache.setL2(user.id, key, transcript, mimeType, base64Data.length, {}))
    return NextResponse.json({ transcript }, { headers: timing.headers('provider') })
  } catch (err) {
    const status = getErrorStatus(err) ?? 500
    timing.headers('error')
    logServerError('Sentence transcription failed', err, { endpoint: '/api/gemini/transcribe-sentence', operation: 'transcribe', status, userId: user.id })
    return publicErrorResponse(status === 504 ? 504 : status >= 500 ? 500 : status, 'Failed to transcribe sentence')
  }
}
