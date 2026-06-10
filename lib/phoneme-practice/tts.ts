const ENGLISH_LANG_PREFIXES = ['en-US', 'en-GB', 'en-AU', 'en-CA', 'en']

let cachedVoices: SpeechSynthesisVoice[] | null = null

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined') return []
  if (cachedVoices) return cachedVoices
  const all = window.speechSynthesis.getVoices()
  const filtered = all.filter((v) =>
    ENGLISH_LANG_PREFIXES.some((prefix) => v.lang.startsWith(prefix))
  )
  // Cache only when voices are populated (may be empty on first call before voiceschanged)
  if (filtered.length > 0) cachedVoices = filtered
  return filtered
}

/** Invalidates the voice cache — call when speechSynthesis fires voiceschanged. */
export function invalidateVoiceCache(): void {
  cachedVoices = null
}

export function speak(
  word: string,
  options: { rate?: number; voice?: SpeechSynthesisVoice } = {}
): void {
  if (typeof window === 'undefined') return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(word)
  utt.rate = options.rate ?? 1.0
  utt.lang = 'en-US'
  if (options.voice) utt.voice = options.voice
  window.speechSynthesis.speak(utt)
}
