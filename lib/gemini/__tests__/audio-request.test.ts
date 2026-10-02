import { describe, it, expect, vi } from 'vitest'
vi.mock('server-only', () => ({}))
vi.mock('@/lib/api/guards', () => ({ validateBody: vi.fn() }))
import { readTranscriptionAudio } from '../audio-request'

function request(blob: Blob, targetWord?: string) {
  const form = new FormData()
  form.append('audio', blob, 'recording')
  if (targetWord) form.append('targetWord', targetWord)
  return new Request('http://localhost/api/gemini/transcribe', { method: 'POST', body: form })
}

describe('multipart audio validation', () => {
  it('transfers the same audio bytes without base64 on the wire', async () => {
    const { data } = await readTranscriptionAudio(request(new Blob(['audio'], { type: 'audio/webm;codecs=opus' }), 'hello') as never, 100)
    expect(data).toEqual({ mimeType: 'audio/webm;codecs=opus', base64Data: Buffer.from('audio').toString('base64'), targetWord: 'hello' })
  })
  it.each([
    new Blob(['audio'], { type: 'text/plain' }),
    new Blob([], { type: 'audio/webm' }),
    new Blob(['x'.repeat(101)], { type: 'audio/webm' }),
  ])('rejects empty, oversized or non-audio input before a provider call', async blob => {
    await expect(readTranscriptionAudio(request(blob) as never, 100)).rejects.toMatchObject({ status: 400 })
  })
})
