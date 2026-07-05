import type { DailyStep, DailyStepKind } from '@/lib/practice/types'

export type StepThreadHint = {
  word: string
  fromStepTitle: string
  fromStepKind: DailyStepKind
}

const THREAD_STEP_KINDS = new Set<DailyStepKind>([
  'word_intro',
  'word_review',
  'context_practice',
  'reader',
])

function normalizeWord(word: string): string {
  return word.trim().toLowerCase()
}

/** Words featured in a vocab/reader step (for thread detection). */
export function extractFeaturedWords(step: DailyStep): string[] {
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

/**
 * Words in step `index` that already appeared in an earlier vocab/reader step.
 */
export function getThreadHintsForStep(steps: DailyStep[], index: number): StepThreadHint[] {
  if (index <= 0 || index >= steps.length) return []

  const prior = new Map<string, { title: string; kind: DailyStepKind }>()

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
      hints.push({
        word,
        fromStepTitle: source.title,
        fromStepKind: source.kind,
      })
    }
  }

  return hints.sort((a, b) => a.word.localeCompare(b.word))
}
