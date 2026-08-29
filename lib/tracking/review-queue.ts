import type { ExerciseSourceRef, CsShadowPhraseExercise } from '@/lib/exercises/types'
import { generateSpokenProductionFromWordBank } from '@/lib/exercises/generators/production'
import { generateSentenceContextExercises } from '@/lib/lexicon/exercises'
import { fromGenericExercise } from '@/lib/practice/adapters'
import type { PracticeExercise } from '@/lib/practice/types'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { isUuid } from '@/lib/review/content-ref'
import type { TrackedItem, TrackingItem, TrackedKind } from './types'
import { getTarget, targetId } from '@/lib/pronunciation/targets/registry'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'
import { resolveLessonHref } from '@/lib/courses/curriculumIndex'

export type TrackingReviewSource =
  | { item: TrackingItem; word: WordBankEntry }
  | { item: TrackingItem; trackedItem: TrackedItem }

export interface CanonicalPhraseReviewTarget {
  sourceRef: ExerciseSourceRef
  phrase: string
  deckSlug: string
  pronunciationTargetId?: PronunciationTargetId
  topic?: string
}

export type TrackingReviewSkipCode =
  | 'missing_word'
  | 'invalid_word_ref'
  | 'unsupported_word'
  | 'canonical_target_unresolved'
  | 'invalid_target_ref'
  | 'missing_lesson_ref'

export interface TrackingReviewSkip {
  itemId: string
  kind: TrackedKind
  title: string
  code: TrackingReviewSkipCode
  detail: string
}

export interface TrackingReviewQueueItem {
  id: string
  kind: TrackedKind
  title: string
  description?: string | null
  href?: string
}

export interface TrackingReviewQueue {
  items: TrackingReviewQueueItem[]
  exercises: PracticeExercise[]
  skipped: TrackingReviewSkip[]
  notices: Array<{ itemId: string; code: 'activity_only'; detail: string }>
}

export interface BuildTrackingReviewQueueOptions {
  resolvePhrase?: (trackedItem: TrackedItem) => CanonicalPhraseReviewTarget | null
}

export type TrackedPhraseResolution =
  | { ok: true; target: CanonicalPhraseReviewTarget }
  | { ok: false; detail: string }

/** Resolve payload metadata only; phrase text is never used to guess a target. */
export function resolveTrackedPhrase(trackedItem: TrackedItem): TrackedPhraseResolution {
  const phrase = typeof trackedItem.payload.text === 'string'
    ? trackedItem.payload.text.trim()
    : (trackedItem.title ?? trackedItem.ref).trim()
  if (!phrase) return { ok: false, detail: 'La frase guardada ya no contiene texto practicable.' }

  const rawTargetId = trackedItem.payload.pronunciationTargetId
  let pronunciationTargetId: PronunciationTargetId | undefined
  if (rawTargetId !== undefined) {
    if (typeof rawTargetId !== 'string' || !getTarget(rawTargetId).ok) {
      return { ok: false, detail: 'La referencia de pronunciación ya no existe.' }
    }
    pronunciationTargetId = targetId(rawTargetId)
  }
  const topic = typeof trackedItem.payload.topicId === 'string'
    ? trackedItem.payload.topicId.trim() || undefined
    : undefined
  return {
    ok: true,
    target: {
      sourceRef: { source: 'tracked_items', id: trackedItem.id },
      phrase,
      deckSlug: 'tracking-phrases',
      pronunciationTargetId,
      topic,
    },
  }
}

function queueItem(item: TrackingItem, href?: string): TrackingReviewQueueItem {
  return {
    id: item.id,
    kind: item.kind,
    title: item.title,
    description: item.description,
    href: href ?? item.href,
  }
}

function skip(
  source: TrackingReviewSource,
  code: TrackingReviewSkipCode,
  detail: string,
): TrackingReviewSkip {
  return {
    itemId: source.item.id,
    kind: source.item.kind,
    title: source.item.title,
    code,
    detail,
  }
}

/**
 * Build a review queue from the exact visible selection.
 *
 * This adapter never creates a synthetic tracked-item SRS namespace. Words
 * keep their real word_bank UUID, phrases require a canonical target resolver
 * (plan 066), and lessons remain exact lesson links. Missing/deleted content is
 * returned as an actionable skip instead of silently becoming generic practice.
 */
export function buildTrackingReviewQueue(
  sources: TrackingReviewSource[],
  options: BuildTrackingReviewQueueOptions = {},
): TrackingReviewQueue {
  const items: TrackingReviewQueueItem[] = []
  const exercises: PracticeExercise[] = []
  const skipped: TrackingReviewSkip[] = []
  const notices: TrackingReviewQueue['notices'] = []
  const seenItemIds = new Set<string>()

  for (const source of sources) {
    if (seenItemIds.has(source.item.id)) continue
    seenItemIds.add(source.item.id)

    if (source.item.kind === 'word') {
      const word = 'word' in source ? source.word : undefined
      if (!word) {
        skipped.push(skip(source, 'missing_word', 'La palabra ya no está disponible en tu léxico.'))
        continue
      }
      if (word.id !== source.item.id || !isUuid(word.id)) {
        skipped.push(skip(source, 'invalid_word_ref', 'La referencia guardada ya no apunta a una palabra válida.'))
        continue
      }

      const wordEntry = {
        id: word.source_ref || word.id,
        word: word.text,
        pos: 'n' as const,
        definition: word.meaning ?? '',
        ipa: word.ipa ?? undefined,
        translation: word.translation ?? undefined,
        difficulty: (word.difficulty ?? 2) as 1 | 2 | 3,
        tags: [],
        exampleSentence: word.example ?? undefined,
        bankId: word.id,
      }
      const contextual = generateSentenceContextExercises([wordEntry], [wordEntry])
      const spoken = contextual.length === 0
        ? generateSpokenProductionFromWordBank([word], 1).exercises.map((exercise) => ({
            ...exercise,
            sourceRef: { source: 'word_bank' as const, id: word.id },
          }))
        : []
      const generated = contextual.length > 0 ? contextual : spoken
      if (generated.length === 0) {
        skipped.push(skip(source, 'unsupported_word', 'Necesita una oración o texto suficiente para practicarla.'))
        continue
      }

      items.push(queueItem(source.item))
      exercises.push(...generated.map((exercise) => fromGenericExercise(exercise, 'review')))
      continue
    }

    if (source.item.kind === 'phrase') {
      const trackedItem = 'trackedItem' in source ? source.trackedItem : undefined
      const externalTarget = trackedItem && options.resolvePhrase?.(trackedItem)
      const resolution = externalTarget
        ? { ok: true as const, target: externalTarget }
        : trackedItem
          ? resolveTrackedPhrase(trackedItem)
          : { ok: false as const, detail: 'La frase guardada ya no está disponible.' }
      if (!resolution.ok) {
        skipped.push(skip(source, 'invalid_target_ref', resolution.detail))
        continue
      }
      const target = resolution.target
      const phraseExercise: CsShadowPhraseExercise = {
        id: `tracking-phrase:${target.sourceRef.source}:${target.sourceRef.id}`,
        type: 'cs_shadow_phrase',
        sourceRef: target.sourceRef,
        phrase: target.phrase,
        deckSlug: target.deckSlug,
        pronunciationTargetId: target.pronunciationTargetId,
        topic: target.topic,
      }
      items.push(queueItem(source.item))
      exercises.push(fromGenericExercise(phraseExercise, 'review'))
      if (!target.pronunciationTargetId && !target.topic) {
        notices.push({
          itemId: source.item.id,
          code: 'activity_only',
          detail: 'Esta frase practica escucha y shadowing, pero no cambia progreso hasta tener un objetivo explícito.',
        })
      }
      continue
    }

    const trackedItem = 'trackedItem' in source ? source.trackedItem : undefined
    if (!trackedItem?.ref) {
      skipped.push(skip(source, 'missing_lesson_ref', 'La lección guardada ya no tiene una referencia válida.'))
      continue
    }
    items.push(queueItem(source.item, source.item.href ?? resolveLessonHref(trackedItem.ref, trackedItem.payload)))
  }

  return { items, exercises, skipped, notices }
}
