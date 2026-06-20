import type {
  FillBlankExercise,
  GenericExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
} from '@/lib/exercises/types'
import { blankWord, exerciseId, isLikelySentence, pick, shuffle, tokenize } from '@/lib/exercises/utils'
import type { TextFragment } from './reorder-from-fragments'

const MIN_TOKENS = 4
const FILL_BLANK_OPTIONS = 4

/**
 * Very small English stopword set — used to avoid blanking function words
 * (the/is/to…) in fill-blank exercises, which are too easy/ambiguous.
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'to', 'of', 'in', 'on', 'at', 'is', 'am', 'are', 'was',
  'were', 'be', 'and', 'or', 'but', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that',
  'do', 'does', 'did', 'not', 'with', 'for', 'so', 'as', 'by',
])

/** Strips surrounding punctuation from a token: "eat." → "eat". */
function cleanToken(token: string): string {
  return token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
}

/** Common Spanish function words — strong signal the sentence is not English. */
const SPANISH_MARKERS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'que', 'y',
  'en', 'con', 'por', 'para', 'voy', 'soy', 'es', 'son', 'mi', 'tu', 'su',
  'ver', 'cada', 'muchas', 'este', 'esta', 'al', 'del', 'mes', 'semana',
])

/**
 * Heuristic: true when the sentence reads as English, not Spanish.
 * Rejects Spanish punctuation/accents and sentences dominated by Spanish
 * function words, so non-English seed fragments don't become broken exercises.
 */
export function isLikelyEnglish(text: string): boolean {
  // Spanish-only punctuation or accented characters.
  if (/[¿¡áíóúñ]/i.test(text)) return false

  const words = tokenize(text).map((w) => cleanToken(w).toLowerCase()).filter(Boolean)
  if (words.length === 0) return false

  const spanishHits = words.filter((w) => SPANISH_MARKERS.has(w)).length
  // More than a third of the words being Spanish markers → treat as Spanish.
  return spanishHits / words.length <= 0.34
}

/** Picks the longest content word in a sentence (skips stopwords). */
function pickContentWord(sentence: string): string | null {
  const words = tokenize(sentence)
    .map(cleanToken)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase()))
  if (words.length === 0) return null
  return words.sort((a, b) => b.length - a.length)[0]
}

function shuffleDistinct(tokens: string[]): string[] {
  if (tokens.length <= 1) return [...tokens]
  let result = shuffle(tokens)
  for (let i = 0; i < 10 && result.every((t, idx) => t === tokens[idx]); i++) {
    result = shuffle(tokens)
  }
  return result
}

function buildReorder(fragment: TextFragment): ReorderWordsExercise {
  const tokens = tokenize(fragment.content)
  return {
    id: exerciseId('reorder_words', fragment.id, fragment.content),
    type: 'reorder_words',
    exerciseType: { domain: 'vocabulary', mode: 'reorder', variant: 'sentence' },
    sourceRef: { source: 'text_fragments', id: fragment.id },
    sentence: fragment.content,
    tokens: shuffleDistinct(tokens),
  }
}

function buildDictation(fragment: TextFragment): SentenceDictationExercise {
  return {
    id: exerciseId('sentence_dictation', fragment.id, fragment.content),
    type: 'sentence_dictation',
    exerciseType: { domain: 'vocabulary', mode: 'sentence_dictation' },
    sourceRef: { source: 'text_fragments', id: fragment.id },
    sentence: fragment.content,
    audioUrl: null,
  }
}

/**
 * Builds a fill-blank from the fragment by blanking a content word and drawing
 * distractors from the other fragments' content words. Returns null when no
 * usable word or not enough distractors exist.
 */
function buildFillBlank(fragment: TextFragment, distractorPool: string[]): FillBlankExercise | null {
  const answer = pickContentWord(fragment.content)
  if (!answer) return null

  const sentence = blankWord(fragment.content, answer)
  if (!sentence) return null

  const distractors = pick(
    distractorPool.filter((w) => w.toLowerCase() !== answer.toLowerCase()),
    FILL_BLANK_OPTIONS - 1,
  )
  if (distractors.length < FILL_BLANK_OPTIONS - 1) return null

  return {
    id: exerciseId('fill_blank', fragment.id, answer),
    type: 'fill_blank',
    exerciseType: { domain: 'vocabulary', mode: 'fill_blank', variant: 'sentence' },
    sourceRef: { source: 'text_fragments', id: fragment.id },
    sentence,
    answer,
    options: shuffle([answer, ...distractors]),
    hints: { level1: `Empieza con "${answer.charAt(0).toUpperCase()}"`, level2: `La palabra es: ${answer}` },
  }
}

/**
 * Generates a mixed set of exercises from sentence fragments: reorder-words,
 * sentence-dictation and fill-blank. Distributes types roughly evenly so each
 * lesson's practice feels varied instead of "armar oraciones" only.
 */
export function generateMixedFromFragments(
  fragments: TextFragment[],
  count: number,
): GenericExercise[] {
  const usable = fragments.filter(
    (f) =>
      isLikelySentence(f.content) &&
      isLikelyEnglish(f.content) &&
      tokenize(f.content).length >= MIN_TOKENS,
  )
  if (usable.length === 0) return []

  // Content-word pool for fill-blank distractors, drawn from all usable sentences.
  const distractorPool = Array.from(
    new Set(
      usable
        .flatMap((f) => tokenize(f.content).map(cleanToken))
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase())),
    ),
  )

  const selected = pick(usable, count)
  const exercises: GenericExercise[] = []

  selected.forEach((fragment, i) => {
    // Round-robin across the three types: reorder, dictation, fill-blank.
    const variant = i % 3
    if (variant === 0) {
      exercises.push(buildReorder(fragment))
    } else if (variant === 1) {
      exercises.push(buildDictation(fragment))
    } else {
      const fb = buildFillBlank(fragment, distractorPool)
      // Fall back to reorder when the sentence can't yield a fill-blank.
      exercises.push(fb ?? buildReorder(fragment))
    }
  })

  return exercises
}
