import { fromGenericExercise } from '@/lib/practice/adapters'
import { generateMatchPairsFromChunks } from '@/lib/exercises/generators/match-pairs'
import type { CEFRLevel } from '@/lib/exercises/cefr'
import type { GenericExercise } from '@/lib/exercises/types'
import { fitsReorderLength } from '@/lib/exercises/utils'
import type { PracticeContext, PracticeExercise } from '@/lib/practice/types'
import type { LearningChunk } from './types'
import { chunkCefrSupport, type ChunkCefrSupport } from './cefr-ladder'

function hash(value: string): number {
  let result = 2166136261
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619)
  return result >>> 0
}

function distractorsFor(target: LearningChunk, catalog: readonly LearningChunk[]): string[] {
  return catalog
    .filter((chunk) => chunk.id !== target.id)
    .sort((a, b) => {
      const aMatch = Number(a.learning.communicativeFunction === target.learning.communicativeFunction)
      const bMatch = Number(b.learning.communicativeFunction === target.learning.communicativeFunction)
      return bMatch - aMatch || hash(`${target.id}:${a.id}`) - hash(`${target.id}:${b.id}`)
    })
    .slice(0, 3)
    .map((chunk) => chunk.chunk)
}

function recognitionExercise(target: LearningChunk, catalog: readonly LearningChunk[]): GenericExercise {
  const options = [target.chunk, ...distractorsFor(target, catalog)]
    .sort((a, b) => hash(`${target.id}:${a}`) - hash(`${target.id}:${b}`))
  return {
    id: `chunk:${target.id}:recognition`,
    type: 'multiple_choice',
    exerciseType: { domain: 'vocabulary', mode: 'multiple_choice' },
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    question: target.learning.recognitionCueEs,
    options,
    answerIndex: options.indexOf(target.chunk),
    explanation: `${target.chunk} — ${target.meaning}`,
    audioText: target.chunk,
  }
}

function dictationExercise(target: LearningChunk): GenericExercise {
  return {
    id: `chunk:${target.id}:dictation`,
    type: 'sentence_dictation',
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    sentence: target.learning.practiceAnswer,
    audioUrl: null,
    targetWord: target.learning.coreText,
    targetMeaning: target.meaning,
    acceptedAnswers: target.learning.acceptedAnswers,
  }
}

function clozeExercise(target: LearningChunk, catalog: readonly LearningChunk[]): GenericExercise {
  const answer = target.learning.coreText
  const sentence = target.learning.practiceAnswer.includes(answer)
    ? target.learning.practiceAnswer.replace(answer, '___')
    : `___`
  const options = [answer, ...distractorsFor(target, catalog).slice(0, 3)]
  return {
    id: `chunk:${target.id}:cloze`,
    type: 'fill_blank',
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    sentence,
    answer,
    options,
    hint: target.meaning,
    audioText: target.learning.practiceAnswer,
  }
}

/**
 * Null when the chunk's sentence is too long to reorder at `learnerLevel`:
 * an 8-token board tests working memory rather than the chunk itself, so the
 * stage is skipped and the remaining stages carry the chunk.
 */
function reconstructionExercise(
  target: LearningChunk,
  learnerLevel?: CEFRLevel,
): GenericExercise | null {
  if (!fitsReorderLength(target.learning.practiceAnswer, learnerLevel)) return null

  const tokens = target.learning.practiceAnswer.split(/\s+/)
    .sort((left, right) => hash(`${target.id}:${left}`) - hash(`${target.id}:${right}`))
  return {
    id: `chunk:${target.id}:reconstruction`,
    type: 'reorder_words',
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    sentence: target.learning.practiceAnswer,
    tokens,
  }
}

function substitutionExercise(target: LearningChunk): GenericExercise | null {
  const slot = target.learning.slots[0]
  if (!slot || !target.learning.template) return null
  const value = slot.exampleValues.find((candidate) => !target.learning.practiceAnswer.includes(candidate))
  if (!value) return null
  const referenceAnswer = target.learning.template.replace(`{${slot.id}}`, value)
  return {
    id: `chunk:${target.id}:substitution:${value}`,
    type: 'sentence_transformation',
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    sourceSentence: target.learning.practiceAnswer,
    instruction: `Cambia solo ${slot.promptEs} por “${value}”.`,
    referenceAnswer,
  }
}

function microdialogueExercise(target: LearningChunk): GenericExercise | null {
  const turn = target.example_dialogue?.find((candidate) =>
    candidate.en.toLowerCase().includes(target.learning.coreText.toLowerCase()),
  )
  if (!turn) return null
  return {
    id: `chunk:${target.id}:microdialogue`,
    type: 'translation_es_en',
    sourceRef: { source: 'chunks', id: target.id },
    level: target.learning.cefr,
    sourceEs: turn.es,
    referenceEn: turn.en,
    acceptedAnswers: [target.learning.practiceAnswer, ...target.learning.acceptedAnswers],
  }
}

function productionPrompt(target: LearningChunk, responseFreedom: ChunkCefrSupport['responseFreedom']): string {
  if (responseFreedom === 'open') {
    return `${target.learning.productionCueEs} Usa el chunk en una respuesta propia, sin copiar la oración modelo. Añade un matiz o detalle natural y ajusta el registro a la situación.`
  }
  if (responseFreedom === 'guided') {
    return `${target.learning.productionCueEs} Usa el chunk, pero formula una respuesta propia para una situación cercana; no copies la oración modelo.`
  }
  return target.learning.productionCueEs
}

function productionExercises(target: LearningChunk, responseFreedom: ChunkCefrSupport['responseFreedom']): GenericExercise[] {
  const shared = {
    sourceRef: { source: 'chunks' as const, id: target.id },
    level: target.learning.cefr,
    taskPrompt: productionPrompt(target, responseFreedom),
    targetItem: target.learning.coreText,
    targetMeaning: target.meaning,
    targetIpa: target.ipa,
    exampleSentence: target.learning.practiceAnswer,
  }
  return [
    { ...shared, id: `chunk:${target.id}:written`, type: 'written_production' },
    { ...shared, id: `chunk:${target.id}:spoken`, type: 'spoken_production' },
  ]
}

export function buildChunkExercises(
  chunks: readonly LearningChunk[],
  catalog: readonly LearningChunk[],
  context: PracticeContext,
  learnerLevel: CEFRLevel,
): PracticeExercise[] {
  const support = chunkCefrSupport(learnerLevel)
  // Form ↔ meaning recognition opens the step: the board shows today's chunks
  // together, which is what makes new material legible as new. Filler is level
  // capped so a board never previews expressions above the learner.
  const matchPairs = generateMatchPairsFromChunks(
    chunks,
    filterChunksForLevel(catalog, learnerLevel),
  )
  const generic = chunks.flatMap((chunk, index) => [
    recognitionExercise(chunk, catalog),
    ...(support.stages.includes('cloze') ? [clozeExercise(chunk, catalog)] : []),
    ...(support.stages.includes('reconstruction')
      ? [reconstructionExercise(chunk, learnerLevel)].filter((exercise) => exercise !== null)
      : []),
    ...(support.stages.includes('substitution') ? [substitutionExercise(chunk)].filter((exercise) => exercise !== null) : []),
    ...(support.stages.includes('microdialogue') ? [microdialogueExercise(chunk)].filter((exercise) => exercise !== null) : []),
    ...(support.allowFullDictation ? [dictationExercise(chunk)] : []),
    ...(index === 0 ? productionExercises(chunk, support.responseFreedom) : []),
  ])
  return [
    ...matchPairs.map((exercise) => fromGenericExercise(exercise, context)),
    ...generic.map((exercise) => fromGenericExercise(exercise, context)),
  ]
}

export function filterChunksForLevel(chunks: readonly LearningChunk[], level: CEFRLevel): LearningChunk[] {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  return chunks.filter((chunk) => levels.indexOf(chunk.learning.cefr) <= levels.indexOf(level))
}
