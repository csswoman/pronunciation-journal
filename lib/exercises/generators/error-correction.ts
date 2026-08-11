import type { GrammarPairLine, GrammarStudyDeckData } from '@/lib/courses/grammar-deck/types'
import type { ErrorCorrectionExercise } from '@/lib/exercises/types'
import { exerciseId } from '@/lib/exercises/utils'
import { normalizeTopic } from '@/lib/practice/normalize-topic'

export type AuthoredPairSkipReason =
  | 'bad_without_good'
  | 'consecutive_bad'
  | 'good_without_bad'
  | 'empty_text'

export interface AuthoredErrorPair {
  bad: string
  good: string
  explanation?: string
  cardId: string
  blockIndex: number
  lineIndex: number
}

export interface AuthoredPairSkip {
  reason: AuthoredPairSkipReason
  cardId: string
  blockIndex: number
  lineIndex: number
}

export interface AuthoredPairExtraction {
  pairs: AuthoredErrorPair[]
  skipped: AuthoredPairSkip[]
}

function meaningful(line: GrammarPairLine): boolean {
  return line.text.trim().length > 0
}

/** Pairs only adjacent bad -> good lines inside the exact same authored block. */
export function extractAuthoredErrorPairs(deck: GrammarStudyDeckData): AuthoredPairExtraction {
  const pairs: AuthoredErrorPair[] = []
  const skipped: AuthoredPairSkip[] = []

  for (const card of deck.cards) {
    card.blocks.forEach((block, blockIndex) => {
      if (block.type !== 'pairs') return
      const pairedGoodLines = new Set<number>()
      for (let lineIndex = 0; lineIndex < block.lines.length; lineIndex += 1) {
        const line = block.lines[lineIndex]
        if (!meaningful(line)) {
          skipped.push({ reason: 'empty_text', cardId: card.id, blockIndex, lineIndex })
          continue
        }
        if (line.variant === 'good') {
          if (!pairedGoodLines.has(lineIndex)) {
            skipped.push({ reason: 'good_without_bad', cardId: card.id, blockIndex, lineIndex })
          }
          continue
        }

        const previous = block.lines[lineIndex - 1]
        if (previous?.variant === 'bad') {
          skipped.push({ reason: 'consecutive_bad', cardId: card.id, blockIndex, lineIndex })
          continue
        }
        const next = block.lines[lineIndex + 1]
        if (!next || next.variant !== 'good') {
          skipped.push({
            reason: next?.variant === 'bad' ? 'consecutive_bad' : 'bad_without_good',
            cardId: card.id,
            blockIndex,
            lineIndex,
          })
          continue
        }
        if (!meaningful(next)) {
          skipped.push({ reason: 'empty_text', cardId: card.id, blockIndex, lineIndex: lineIndex + 1 })
          skipped.push({ reason: 'bad_without_good', cardId: card.id, blockIndex, lineIndex })
          continue
        }
        pairs.push({
          bad: line.text,
          good: next.text,
          explanation: line.note ?? next.note,
          cardId: card.id,
          blockIndex,
          lineIndex,
        })
        pairedGoodLines.add(lineIndex + 1)
      }
    })
  }
  return { pairs, skipped }
}

export function normalizeReviewTopic(topic: string): string {
  const normalized = normalizeTopic(topic.startsWith('grammar:') ? topic : `grammar:${topic}`)
  if (!normalized) throw new Error(`Invalid review topic: ${topic}`)
  return normalized
}

export function generateErrorCorrectionFromDeck(
  deckSlug: string,
  topic: string,
  deck: GrammarStudyDeckData,
  limit: number,
): ErrorCorrectionExercise[] {
  const sourceRef = { source: 'text_fragments' as const, id: `grammar-deck:${deckSlug}` }
  const normalizedTopic = normalizeReviewTopic(topic)
  return extractAuthoredErrorPairs(deck).pairs.slice(0, Math.max(0, limit)).map((pair) => ({
    id: exerciseId('error_correction', sourceRef.id, `${pair.cardId}:${pair.blockIndex}:${pair.lineIndex}:${pair.bad}:${pair.good}`),
    type: 'error_correction',
    sourceRef,
    topic: normalizedTopic,
    sentence: pair.bad,
    correctSentence: pair.good,
    explanation: pair.explanation,
  }))
}
