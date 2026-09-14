import type { DailyStep, DailyStepKind } from '@/lib/practice/types'

export type StepThreadHint = {
  word: string
  /** IPA from a prior study card when available. */
  ipa?: string
  fromStepTitle: string
  fromStepKind: DailyStepKind
}

const THREAD_STEP_KINDS = new Set<DailyStepKind>([
  'word_intro',
  'chunk_intro',
  'word_review',
  'context_practice',
  'reader',
])

function normalizeWord(word: string): string {
  return word.trim().toLowerCase()
}

function wordForChunkAnchor(
  chunk: NonNullable<DailyStep['chunks']>[number],
  index: number,
): string {
  const anchor = chunk.contentGraph.anchors[index]
  if (anchor?.owner === 'essential_words' && anchor.id.startsWith('c1k:')) {
    return normalizeWord(anchor.id.slice('c1k:'.length))
  }
  const highlight = chunk.contentGraph.highlights[index]
  return highlight ? normalizeWord(chunk.contentGraph.text.slice(highlight.start, highlight.end)) : ''
}

/** Words featured in a vocab/reader step (for thread detection). */
export function extractFeaturedWords(step: DailyStep): string[] {
  // Prefer the stable Essential Word ID for chunk bridges: an authored anchor
  // may point at the lemma "go" while the visible marked form is "going".
  if ((step.kind === 'chunk_intro' || step.kind === 'chunk_review') && step.chunks) {
    return step.chunks.flatMap((chunk) => chunk.contentGraph.anchors
      .map((_, index) => wordForChunkAnchor(chunk, index))
      .filter(Boolean))
  }

  if (step.featuredWords?.length) {
    return step.featuredWords.map(normalizeWord)
  }

  if (step.kind === 'word_intro') {
    return (step.studyCards ?? []).map((card) => normalizeWord(card.word))
  }

  if (step.kind === 'reader' && step.readerPassage) {
    return step.readerPassage.targetItems.map(normalizeWord)
  }

  return []
}

/** Collect IPA spellings from study cards across the plan. */
function buildIpaIndex(steps: DailyStep[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const step of steps) {
    for (const card of step.studyCards ?? []) {
      const key = normalizeWord(card.word)
      if (key && card.ipa && !map.has(key)) {
        map.set(key, card.ipa)
      }
    }
  }
  return map
}

/**
 * Words in step `index` that already appeared in an earlier vocab/reader step.
 */
export function getThreadHintsForStep(steps: DailyStep[], index: number): StepThreadHint[] {
  if (index <= 0 || index >= steps.length) return []

  const prior = new Map<string, { title: string; kind: DailyStepKind }>()
  const ipaByWord = buildIpaIndex(steps)

  for (let i = 0; i < index; i++) {
    const step = steps[i]
    if (!THREAD_STEP_KINDS.has(step.kind)) continue

    for (const word of extractFeaturedWords(step)) {
      if (!word) continue
      if (!prior.has(word)) {
        prior.set(word, { title: step.title, kind: step.kind })
      }
    }
  }

  const currentWords = extractFeaturedWords(steps[index])
  const hints: StepThreadHint[] = []

  for (const word of currentWords) {
    const source = prior.get(word)
    if (source) {
      const ipa = ipaByWord.get(word)
      hints.push({
        word,
        ...(ipa ? { ipa } : {}),
        fromStepTitle: source.title,
        fromStepKind: source.kind,
      })
    }
  }

  return hints.sort((a, b) => a.word.localeCompare(b.word))
}
