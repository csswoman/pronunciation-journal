import type { ContentMapEntry } from '@/lib/pronunciation/targets/content-map'

/** Best safe content URL for a path unit — omit rather than invent broken routes. */
export function contentHrefForRefs(refs: readonly ContentMapEntry[]): string | null {
  const lesson = refs.find((ref) => ref.kind === 'public_lesson')
  if (lesson) return `/mini-lessons/${lesson.slug}`
  return null
}
