/** Expand bounded `{a|b}` alternatives in a canonical answer template. */
export function expandTemplate(template: string): string[] {
  const parts: string[][] = []
  let lastIndex = 0
  const regex = /\{([^{}]+)\}/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) parts.push([template.slice(lastIndex, match.index)])
    parts.push(match[1].split('|'))
    lastIndex = regex.lastIndex
  }
  if (lastIndex < template.length) parts.push([template.slice(lastIndex)])
  if (parts.length === 0) return ['']

  const total = parts.reduce((acc, part) => acc * part.length, 1)
  if (total > 64) {
    throw new Error(`Template expansion exceeded limit of 64 (got ${total})`)
  }

  let combinations = parts[0]
  for (let i = 1; i < parts.length; i++) {
    const next: string[] = []
    for (const prefix of combinations) {
      for (const option of parts[i]) next.push(prefix + option)
    }
    combinations = next
  }
  return combinations
}
