import type { Exercise } from '@/lib/phoneme-practice/types'
import type {
  FillBlankExercise,
  GenericExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  ReorderWordsExercise,
  SentenceContextExercise,
  SentenceDictationExercise,
} from '@/lib/exercises/types'
import { fromGenericExercise, fromMixedExercise } from '@/lib/practice/adapters'
import type { ExerciseSlug, PracticeContext, PracticeExercise } from '@/lib/practice/types'

const SOURCE = { source: 'word_bank' as const, id: 'test-gallery' }
const SOUND_ID = 42
const IPA = 'iː'

export type TestGalleryDomain = 'vocabulary' | 'pronunciation' | 'grammar'

export type TestGalleryEntry = {
  id: string
  slug: ExerciseSlug
  label: string
  domain: TestGalleryDomain
  build: (context: PracticeContext) => PracticeExercise
}

function adaptGeneric(exercise: GenericExercise, context: PracticeContext): PracticeExercise {
  return fromGenericExercise(exercise, context)
}

function adaptPhoneme(exercise: Exercise, context: PracticeContext): PracticeExercise {
  return fromMixedExercise({ kind: 'phoneme', data: exercise }, context)
}

const GENERIC_FIXTURES: Record<
  Exclude<
    ExerciseSlug,
    | 'pick_word'
    | 'pick_sound'
    | 'minimal_pair'
    | 'dictation'
    | 'speak_word'
    | 'identify'
    | 'ax_same_different'
    | 'odd_one_out'
    | 'abx'
    | 'reader'
  >,
  GenericExercise
> = {
  fill_blank: {
    id: 'test-fill_blank',
    type: 'fill_blank',
    sourceRef: SOURCE,
    sentence: 'I ___ apples every morning.',
    answer: 'eat',
    options: ['eat', 'ate', 'eating', 'eats'],
    hint: 'consume food',
  },
  sentence_dictation: {
    id: 'test-sentence_dictation',
    type: 'sentence_dictation',
    sourceRef: SOURCE,
    sentence: 'She went to the store yesterday.',
    audioUrl: null,
    targetWord: 'store',
    targetMeaning: 'a place where you buy things',
  },
  match_pairs: {
    id: 'test-match_pairs',
    type: 'match_pairs',
    sourceRef: SOURCE,
    pairs: [
      { id: 'p1', left: 'seat', right: '/siːt/' },
      { id: 'p2', left: 'sit', right: '/sɪt/' },
      { id: 'p3', left: 'sheet', right: '/ʃiːt/' },
    ],
  },
  reorder_words: {
    id: 'test-reorder_words',
    type: 'reorder_words',
    sourceRef: SOURCE,
    sentence: 'They are studying English together.',
    tokens: ['together.', 'studying', 'They', 'English', 'are'],
  },
  sentence_context: {
    id: 'test-sentence_context',
    type: 'sentence_context',
    sourceRef: SOURCE,
    sentence: 'The weather was ___ yesterday.',
    fullSentence: 'The weather was pleasant yesterday.',
    answer: 'pleasant',
    definition: 'enjoyable, nice',
    options: [
      { id: 'a', word: 'pleasant' },
      { id: 'b', word: 'pleased' },
      { id: 'c', word: 'pleasing' },
      { id: 'd', word: 'pleasure' },
    ],
  },
  multiple_choice: {
    id: 'test-multiple_choice',
    type: 'multiple_choice',
    sourceRef: { source: 'text_fragments', id: 'cs-linking' },
    question: 'How does "going to" often sound in fast speech?',
    options: ['gonna', 'going too', 'go into', 'gone to'],
    answerIndex: 0,
    explanation: 'Reduction: going to → gonna in connected speech.',
  },
  written_production: {
    id: 'test-written_production',
    type: 'written_production',
    sourceRef: SOURCE,
    taskPrompt: 'Use "achieve" in an original sentence.',
    targetItem: 'achieve',
    targetMeaning: 'to succeed in doing something',
  },
  spoken_production: {
    id: 'test-spoken_production',
    type: 'spoken_production',
    sourceRef: SOURCE,
    taskPrompt: 'Say a sentence using "achieve".',
    targetItem: 'achieve',
    targetMeaning: 'to succeed in doing something',
  },
}

const PHONEME_FIXTURES: Record<
  | 'pick_word'
  | 'pick_sound'
  | 'minimal_pair'
  | 'dictation'
  | 'speak_word'
  | 'identify'
  | 'ax_same_different'
  | 'odd_one_out'
  | 'abx',
  Exercise
> = {
  pick_word: {
    type: 'pick_word',
    soundId: SOUND_ID,
    ipa: IPA,
    targetWord: 'seat',
    options: [
      { id: 'a', label: 'seat', isCorrect: true },
      { id: 'b', label: 'sit', isCorrect: false },
      { id: 'c', label: 'set', isCorrect: false },
    ],
    correctIds: ['a'],
  },
  pick_sound: {
    type: 'pick_sound',
    soundId: SOUND_ID,
    ipa: IPA,
    options: [
      { id: 'a', label: '/iː/', isCorrect: true },
      { id: 'b', label: '/ɪ/', isCorrect: false },
      { id: 'c', label: '/e/', isCorrect: false },
    ],
    correctIds: ['a'],
  },
  minimal_pair: {
    type: 'minimal_pair',
    soundId: SOUND_ID,
    ipa: IPA,
    targetWord: 'seat',
    options: [
      { id: 'a', label: 'seat', isCorrect: true },
      { id: 'b', label: 'sit', isCorrect: false },
    ],
    correctIds: ['a'],
  },
  dictation: {
    type: 'dictation',
    soundId: SOUND_ID,
    ipa: IPA,
    targetWord: 'seat',
    options: [
      { id: 'a', label: 'seat', isCorrect: true },
      { id: 'b', label: 'sit', isCorrect: false },
    ],
    correctIds: ['a'],
  },
  speak_word: {
    type: 'speak_word',
    soundId: SOUND_ID,
    ipa: IPA,
    targetWord: 'seat',
    options: [{ id: 'a', label: 'seat', isCorrect: true }],
    correctIds: ['a'],
  },
  identify: {
    type: 'identify',
    soundId: SOUND_ID,
    ipa: IPA,
    targetWord: 'seat',
    options: [
      { id: 'yes', label: 'Sí', isCorrect: true },
      { id: 'no', label: 'No', isCorrect: false },
    ],
    correctIds: ['yes'],
  },
  ax_same_different: {
    type: 'ax_same_different',
    soundId: SOUND_ID,
    ipa: IPA,
    stimuli: [
      { word: 'seat', ipa: IPA },
      { word: 'sit', ipa: 'ɪ' },
    ],
    options: [
      { id: 'same', label: 'Igual', isCorrect: false },
      { id: 'diff', label: 'Diferente', isCorrect: true },
    ],
    correctIds: ['diff'],
  },
  odd_one_out: {
    type: 'odd_one_out',
    soundId: SOUND_ID,
    ipa: IPA,
    stimuli: [
      { word: 'seat', ipa: IPA },
      { word: 'sheet', ipa: IPA },
      { word: 'sit', ipa: 'ɪ' },
      { word: 'beat', ipa: IPA },
    ],
    options: [
      { id: '0', label: 'seat', isCorrect: false },
      { id: '1', label: 'sheet', isCorrect: false },
      { id: '2', label: 'sit', isCorrect: true },
      { id: '3', label: 'beat', isCorrect: false },
    ],
    correctIds: ['2'],
    oddIndex: 2,
  },
  abx: {
    type: 'abx',
    soundId: SOUND_ID,
    ipa: IPA,
    stimuli: [
      { word: 'seat', ipa: IPA },
      { word: 'sit', ipa: 'ɪ' },
      { word: 'seat', ipa: IPA },
    ],
    options: [
      { id: 'a', label: 'A', isCorrect: true },
      { id: 'b', label: 'B', isCorrect: false },
    ],
    correctIds: ['a'],
    abxAnswer: 0,
  },
}

const GENERIC_LABELS: Record<keyof typeof GENERIC_FIXTURES, string> = {
  fill_blank: 'Completar frase',
  sentence_dictation: 'Dictado de oración',
  match_pairs: 'Emparejar',
  reorder_words: 'Ordenar palabras',
  sentence_context: 'Contexto de oración',
  multiple_choice: 'Opción múltiple',
  written_production: 'Producción escrita',
  spoken_production: 'Producción oral',
}

const PHONEME_LABELS: Record<keyof typeof PHONEME_FIXTURES, string> = {
  pick_word: 'Elegir palabra',
  pick_sound: 'Elegir sonido',
  minimal_pair: 'Par mínimo',
  dictation: 'Dictado fonémico',
  speak_word: 'Hablar palabra',
  identify: 'Identificar sonido',
  ax_same_different: 'AX igual / diferente',
  odd_one_out: 'El intruso',
  abx: 'ABX',
}

export const TEST_GALLERY_ENTRIES: TestGalleryEntry[] = [
  ...Object.entries(GENERIC_FIXTURES).map(([slug, exercise]) => ({
    id: `generic-${slug}`,
    slug: slug as ExerciseSlug,
    label: GENERIC_LABELS[slug as keyof typeof GENERIC_LABELS],
    domain: (slug === 'multiple_choice' ? 'grammar' : 'vocabulary') as TestGalleryDomain,
    build: (context: PracticeContext) => adaptGeneric(exercise, context),
  })),
  ...Object.entries(PHONEME_FIXTURES).map(([slug, exercise]) => ({
    id: `phoneme-${slug}`,
    slug: slug as ExerciseSlug,
    label: PHONEME_LABELS[slug as keyof typeof PHONEME_LABELS],
    domain: 'pronunciation' as const,
    build: (context: PracticeContext) => adaptPhoneme(exercise, context),
  })),
]

export function buildTestGalleryExercise(
  entryId: string,
  context: PracticeContext,
): PracticeExercise | null {
  const entry = TEST_GALLERY_ENTRIES.find((item) => item.id === entryId)
  return entry ? entry.build(context) : null
}

export function buildAllTestGalleryExercises(context: PracticeContext): PracticeExercise[] {
  return TEST_GALLERY_ENTRIES.map((entry) => entry.build(context))
}

export const FOCUS_UI_CONTEXTS: PracticeContext[] = ['daily', 'review', 'practice', 'sound_lab']
