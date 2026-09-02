import type {
  ErrorCorrectionExercise,
  FillBlankExercise,
  GenericExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
} from '@/lib/exercises/types'
import { blankWord, exerciseId, isLikelySentence, pick, shuffle, tokenize } from '@/lib/exercises/utils'
import { isLikelyEnglish, shuffleDistinct } from './primitives'
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

const PRONOUNS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
])

const MODALS = new Set(['can', 'could', 'should', 'would', 'must', 'may', 'might', 'will', 'shall'])

const PREPOSITIONS = new Set([
  'in', 'on', 'at', 'under', 'over', 'between', 'during', 'behind', 'with', 'for', 'about', 'from', 'into', 'through',
])

/** Strips surrounding punctuation from a token: "eat." → "eat". */
function cleanToken(token: string): string {
  return token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, '')
}

export { isLikelyEnglish } from './primitives'

/** Picks the longest content word in a sentence (skips stopwords). */
function pickContentWord(sentence: string): string | null {
  const words = tokenize(sentence)
    .map(cleanToken)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w.toLowerCase()))
  if (words.length === 0) return null
  return words.sort((a, b) => b.length - a.length)[0]
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

function getCategoryPool(answer: string, fallbackPool: string[]): string[] {
  const lower = answer.toLowerCase()
  if (PRONOUNS.has(lower)) {
    return Array.from(PRONOUNS).filter((w) => w.toLowerCase() !== lower)
  }
  if (MODALS.has(lower)) {
    return Array.from(MODALS).filter((w) => w.toLowerCase() !== lower)
  }
  if (PREPOSITIONS.has(lower)) {
    return Array.from(PREPOSITIONS).filter((w) => w.toLowerCase() !== lower)
  }
  return fallbackPool.filter((w) => w.toLowerCase() !== lower)
}

/**
 * Builds a fill-blank from the fragment by blanking a word and drawing
 * category-aware distractors (pronouns vs pronouns, modals vs modals, or content pool).
 */
function buildFillBlank(fragment: TextFragment, distractorPool: string[]): FillBlankExercise | null {
  const answer = pickContentWord(fragment.content)
  if (!answer) return null

  const sentence = blankWord(fragment.content, answer)
  if (!sentence) return null

  const categoryPool = getCategoryPool(answer, distractorPool)
  const distractors = pick(categoryPool, FILL_BLANK_OPTIONS - 1)
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
 * Builds an error-correction exercise from a sentence fragment by introducing
 * a subtle syntactic error (e.g. swapping third-person 's' or auxiliary).
 */
function buildErrorCorrection(fragment: TextFragment): ErrorCorrectionExercise | null {
  const tokens = tokenize(fragment.content)
  if (tokens.length < MIN_TOKENS) return null

  // Search for third-person verb to misconjugate (e.g. "goes" -> "go", "likes" -> "like")
  let wrongSentence: string | null = null;
  let explanation: string | undefined = undefined;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.endsWith('s') && token.length > 3 && !STOPWORDS.has(token.toLowerCase())) {
      const baseForm = token.slice(0, -1)
      wrongSentence = fragment.content.replace(token, baseForm)
      explanation = `En tercera persona singular se agrega '-s' o '-es': "${token}" es la forma correcta.`
      break
    }
  }

  if (!wrongSentence) return null

  return {
    id: exerciseId('error_correction', fragment.id, fragment.content),
    type: 'error_correction',
    sourceRef: { source: 'text_fragments', id: fragment.id },
    sentence: wrongSentence,
    correctSentence: fragment.content,
    explanation,
  }
}

/**
 * Generates a mixed set of exercises from sentence fragments: reorder-words,
 * sentence-dictation, fill-blank, and error-correction. Distributes types evenly.
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
    // Round-robin across types: reorder, dictation, fill-blank, error-correction
    const variant = i % 4
    if (variant === 0) {
      exercises.push(buildReorder(fragment))
    } else if (variant === 1) {
      exercises.push(buildDictation(fragment))
    } else if (variant === 2) {
      const fb = buildFillBlank(fragment, distractorPool)
      exercises.push(fb ?? buildReorder(fragment))
    } else {
      const ec = buildErrorCorrection(fragment)
      const fb = buildFillBlank(fragment, distractorPool)
      exercises.push(ec ?? fb ?? buildReorder(fragment))
    }
  })

  return exercises
}
