/** Feature flag for learner-facing signal/outcome copy; the data contract stays active. */
export function isActionablePronunciationFeedbackCopyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PRONUNCIATION_ACTIONABLE_FEEDBACK_COPY !== 'false'
}
