/**
 * Collapses consecutive lines where an earlier line is a plain text-prefix of
 * a later one — the shape left behind by a since-fixed hydration race in the
 * guided writer, where an in-progress sentence ("...with m.") got persisted
 * as its own line just before the completed sentence ("...with my husband.")
 * was saved right after it. Only merges adjacent lines; never reorders or
 * touches lines that aren't a strict prefix of their neighbor.
 */
export function dedupePrefixLines(lines: string[]): string[] {
  const result: string[] = []
  for (const line of lines) {
    const prev = result[result.length - 1]
    if (prev !== undefined && line.startsWith(prev.replace(/\.\s*$/, ''))) {
      result[result.length - 1] = line
      continue
    }
    result.push(line)
  }
  return result
}
