/**
 * Presentation-only kill switch for pronunciation-path outcome copy.
 * Unit-state derivation stays on; only learner-facing level/accuracy phrasing
 * is withdrawn when NEXT_PUBLIC_PRONUNCIATION_PATH_COPY=false.
 */
export function isPronunciationPathCopyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRONUNCIATION_PATH_COPY !== 'false'
}
