/** Deep-link into the pronunciation learning route for a canonical target. */
export function targetIdToPronunciationPathRoute(targetId: string): string {
  return `/courses/pronunciation?target=${encodeURIComponent(targetId)}`
}

export function stageIdToPronunciationPathRoute(stageId: string): string {
  return `/courses/pronunciation?stage=${encodeURIComponent(stageId)}`
}
