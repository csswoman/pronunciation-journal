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

/**
 * Speak several words back-to-back. Cancels anything in flight once, then
 * queues each utterance so they play in order (a per-word `speak()` would
 * cancel the previous one). Used for A→X discrimination drills.
 */
export function speakSequence(
  words: string[],
  options: { rate?: number; voice?: SpeechSynthesisVoice } = {}
): void {
  if (typeof window === 'undefined') return
  const usable = words.filter(Boolean)
  if (usable.length === 0) return
  window.speechSynthesis.cancel()
  for (const word of usable) {
    const utt = new SpeechSynthesisUtterance(word)
    utt.rate = options.rate ?? 1.0
    utt.lang = 'en-US'
    if (options.voice) utt.voice = options.voice
    // No cancel() between utterances — the engine queues them in order.
    window.speechSynthesis.speak(utt)
  }
}
