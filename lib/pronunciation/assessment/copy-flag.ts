/**
 * Presentation-only kill switch for diagnostic claims. Historical results
 * remain intact; setting the public flag to "false" merely replaces learner
 * assessment copy with neutral next-step UI.
 */
export function isPronunciationDiagnosticCopyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRONUNCIATION_DIAGNOSTIC_COPY !== 'false'
}
