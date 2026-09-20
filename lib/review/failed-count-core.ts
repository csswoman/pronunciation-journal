export type AnswerTimestampRow = {
  content_id: string | null
  answered_at: string | null
}

export function countUnredeemedFailures(
  failures: readonly AnswerTimestampRow[],
  successes: readonly AnswerTimestampRow[],
): number {
  const latestFailAt = new Map<string, string>()
  for (const row of failures) {
    if (!row.content_id || !row.answered_at) continue
    const previous = latestFailAt.get(row.content_id)
    if (!previous || row.answered_at > previous) latestFailAt.set(row.content_id, row.answered_at)
  }

  const redeemed = new Set<string>()
  for (const row of successes) {
    if (!row.content_id || !row.answered_at) continue
    const failedAt = latestFailAt.get(row.content_id)
    if (failedAt && row.answered_at > failedAt) redeemed.add(row.content_id)
  }
  return latestFailAt.size - redeemed.size
}
