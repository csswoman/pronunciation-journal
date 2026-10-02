import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { validateBody } from '@/lib/api/guards'

const ALLOWED_AUDIO_TYPES = new Set([
  'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/mpeg',
  'audio/aac', 'audio/flac', 'audio/opus', 'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus', 'audio/mp4;codecs=mp4a.40.2',
])

export class AudioRequestError extends Error {
  readonly status = 400
}

/** Multipart avoids base64 on the wire; legacy JSON clients remain supported. */
export async function readTranscriptionAudio(request: NextRequest, maxBytes: number) {
  if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    const length = Number(request.headers.get('content-length'))
    if (length > maxBytes + 16_384) throw new AudioRequestError('Audio payload too large')
    const form = await request.formData().catch(() => { throw new AudioRequestError('Invalid audio form') })
    const audio = form.get('audio')
    const targetWord = form.get('targetWord') ?? undefined
    if (!(audio instanceof Blob) || audio.size === 0 || audio.size > maxBytes) {
      throw new AudioRequestError('Invalid audio size')
    }
    if (targetWord !== undefined && (typeof targetWord !== 'string' || targetWord.length > 100)) {
      throw new AudioRequestError('Invalid target word')
    }
    const mimeType = audio.type.toLowerCase()
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) throw new AudioRequestError('Unsupported audio format')
    return { data: { mimeType, base64Data: Buffer.from(await audio.arrayBuffer()).toString('base64'), targetWord }, error: null }
  }

  const schema = z.object({
    audioDataUrl: z.string().min(1).max(Math.ceil(maxBytes / 3) * 4 + 128),
    targetWord: z.string().max(100).optional(),
  }).strict()
  const result = await validateBody(request, schema)
  if (result.error) return { data: null, error: result.error }
  const match = result.data.audioDataUrl.match(/^data:([^,]+);base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match || !ALLOWED_AUDIO_TYPES.has(match[1].toLowerCase())) {
    throw new AudioRequestError('Invalid audio data URL')
  }
  if (Buffer.from(match[2], 'base64').length > maxBytes) throw new AudioRequestError('Audio payload too large')
  return { data: { mimeType: match[1].toLowerCase(), base64Data: match[2], targetWord: result.data.targetWord }, error: null }
}
