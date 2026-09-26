import type {
  GenericExercise,
  SentenceTransformationExercise,
  ReorderWordsExercise,
  ErrorCorrectionExercise,
  PersonalizationExercise,
} from '@/lib/exercises/types'
import { expandTemplate } from '@/lib/exercises/answer-match'
import { exerciseId, shuffle, tokenize } from '@/lib/exercises/utils'
import type {
  GrammarDrill,
  DrillTransformItem,
  DrillBuildItem,
  DrillCorrectItem,
  DrillPersonalizeItem,
} from '@/lib/courses/grammar-deck/drill-schema'

type BuildContext = {
  deckSlug: string
  drill: GrammarDrill
  sourceRef: { source: 'grammar_deck'; id: string }
}

export const DRILL_ITEM_BUILDERS = {
  transform: (item: DrillTransformItem, ctx: BuildContext): SentenceTransformationExercise => {
    const canonical = expandTemplate(item.accept[0])[0]
    return {
      id: exerciseId('sentence_transformation', ctx.sourceRef.id, item.source),
      type: 'sentence_transformation',
      sourceRef: ctx.sourceRef,
      level: ctx.drill.level,
      lessonSlug: ctx.deckSlug,
      sourceSentence: item.source,
      instruction: item.instruction,
      referenceAnswer: canonical,
      acceptedAnswers: item.accept.flatMap((a) => expandTemplate(a)),
      answerSpec: {
        accept: item.accept,
        contractions: item.contractions,
        mustInclude: item.mustInclude,
        commonWrong: item.commonWrong,
      },
      requires: item.requires,
    }
  },

  buildCombine: (item: Extract<DrillBuildItem, { kind: 'combine' }>, ctx: BuildContext): SentenceTransformationExercise => {
    const canonical = expandTemplate(item.accept[0])[0]
    const sourceSentence = item.sources.join(' ')
    const instruction = item.connector
      ? `Une las oraciones usando ${item.connector}.`
      : 'Une las oraciones en una sola.'
    return {
      id: exerciseId('sentence_transformation', ctx.sourceRef.id, sourceSentence),
      type: 'sentence_transformation',
      sourceRef: ctx.sourceRef,
      level: ctx.drill.level,
      lessonSlug: ctx.deckSlug,
      sourceSentence,
      instruction,
      referenceAnswer: canonical,
      acceptedAnswers: item.accept.flatMap((a) => expandTemplate(a)),
      answerSpec: { accept: item.accept },
      requires: item.requires,
    }
  },

  buildReorder: (item: Extract<DrillBuildItem, { kind: 'reorder' }>, ctx: BuildContext): ReorderWordsExercise => {
    const canonical = expandTemplate(item.accept[0])[0]
    const rawTokens = item.chunks && item.chunks.length > 0 ? item.chunks : tokenize(canonical)
    let shuffled = shuffle(rawTokens)
    if (shuffled.join(' ') === rawTokens.join(' ') && rawTokens.length > 1) {
      shuffled = [...rawTokens].reverse()
    }
    return {
      id: exerciseId('reorder_words', ctx.sourceRef.id, canonical),
      type: 'reorder_words',
      sourceRef: ctx.sourceRef,
      level: ctx.drill.level,
      lessonSlug: ctx.deckSlug,
      sentence: canonical,
      tokens: shuffled,
      answerSpec: { accept: item.accept },
    }
  },

  correct: (item: DrillCorrectItem, ctx: BuildContext): ErrorCorrectionExercise => {
    const canonical = expandTemplate(item.accept[0])[0]
    return {
      id: exerciseId('error_correction', ctx.sourceRef.id, item.sentence),
      type: 'error_correction',
      sourceRef: ctx.sourceRef,
      level: ctx.drill.level,
      lessonSlug: ctx.deckSlug,
      sentence: item.sentence,
      correctSentence: canonical,
      alreadyCorrect: item.alreadyCorrect,
      explanation: item.explanation,
      answerSpec: { accept: item.accept, commonWrong: item.commonWrong },
    }
  },

  personalize: (item: DrillPersonalizeItem, ctx: BuildContext): PersonalizationExercise => {
    const discriminator = item.mode === 'open' ? item.promptEs : item.frame
    return {
      id: exerciseId('personalization', ctx.sourceRef.id, discriminator),
      type: 'personalization',
      sourceRef: ctx.sourceRef,
      level: ctx.drill.level,
      lessonSlug: ctx.deckSlug,
      ...item,
    }
  },
}

/**
 * Builds a deterministic list of GenericExercises from a GrammarDrill payload.
 * Follows the method order: transform -> build -> correct -> personalize.
 */
export function buildGrammarDrill(deckSlug: string, drill: GrammarDrill): GenericExercise[] {
  const exercises: GenericExercise[] = []
  const sourceRef = { source: 'grammar_deck' as const, id: `grammar-deck:${deckSlug}` }
  const ctx: BuildContext = { deckSlug, drill, sourceRef }

  if (drill.transform) {
    for (const item of drill.transform) {
      exercises.push(DRILL_ITEM_BUILDERS.transform(item, ctx))
    }
  }

  if (drill.build) {
    for (const item of drill.build) {
      if (item.kind === 'combine') {
        exercises.push(DRILL_ITEM_BUILDERS.buildCombine(item, ctx))
      } else {
        exercises.push(DRILL_ITEM_BUILDERS.buildReorder(item, ctx))
      }
    }
  }

  if (drill.correct) {
    for (const item of drill.correct) {
      exercises.push(DRILL_ITEM_BUILDERS.correct(item, ctx))
    }
  }

  if (drill.personalize) {
    for (const item of drill.personalize) {
      exercises.push(DRILL_ITEM_BUILDERS.personalize(item, ctx))
    }
  }

  return exercises
}
