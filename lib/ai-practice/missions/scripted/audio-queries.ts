import type { ScriptLine } from '../types'

const memoryAudioCache = new Map<string, string>()

/**
 * Fetches or resolves high-fidelity speech audio for a scripted mission line.
 * Reuses memory cache and existing modelAudio when available.
 */
export async function fetchMissionLineAudio(
  line: ScriptLine,
  missionId: string,
  voice?: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede",
): Promise<string> {
  // If the line already has a recorded audio path, return it directly
  if (line.modelAudio?.path) {
    return line.modelAudio.path
  }

  const cacheKey = `${missionId}:${line.id}`
  const cachedUrl = memoryAudioCache.get(cacheKey)
  if (cachedUrl) {
    return cachedUrl
  }

  const res = await fetch('/api/gemini/mission-audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lineId: line.id,
      lineText: line.text,
      missionId,
      voice,
    }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Failed to fetch mission audio (${res.status})`)
  }

  const data = (await res.json()) as { audioUrl: string }
  memoryAudioCache.set(cacheKey, data.audioUrl)
  return data.audioUrl
}
