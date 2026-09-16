import { fetchEssentialWordsForAnchors, fetchEssentialWordsForDay } from '@/lib/essential-words/client-fetch'
import { db } from '@/lib/db'
import { getAllSounds } from '@/lib/phoneme-practice/queries'
import { dominantTopicLabel } from '@/lib/practice/topic-labels'
import type { DailyPlan, DailyStep, SessionArc } from '@/lib/practice/types'
import { buildJournalDailyStep, shouldOfferJournalStep } from '@/lib/journal/daily-step'
import { shouldOfferMission } from './mission-cadence'
import { capPronunciationSteps, DAILY_PLAN_STEP_COUNT, MAX_DUE_STEPS, RESERVED_CHUNK_NEW_SLOTS, WORD_REVIEW_WORD_COUNT } from './constants'
import {
  fetchDueReviewWords,
  fetchDueSounds,
  fetchNewWords,
  fetchSavedOrFamiliarWords,
  fetchWeakestSoundProgress,
} from './fetchers'
import { dayOfYear, getSemanticContentKey } from './selectors'
import { getWordCategoryIndex } from '@/lib/lexicon/word-index-client'
import { biasWordsBySound } from './sound-word-bridge'
import { biasWordsByChunkAnchors } from './chunk-word-bridge'
import { selectDailyReviewWords } from './saved-priority'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import { candidate, selectDailyCandidates } from './policy'
import { missionForTarget, parseMissionLaunch } from '@/lib/ai-practice/missions/launch'
import { getTarget, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import { duePatterns, type ErrorRecurrenceQueue } from '@/lib/practice/error-recurrence'
import { repairConstraintFor } from '@/lib/exercises/error-patterns'
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'
import {
  buildReviewPlan,
  type BuildReviewPlanOptions,
  type ReviewPlan,
  shouldKeepNonExerciseStep,
} from './review-plan'
import {
  reasonForStep,
  resolvePrimarySound,
  sortStepsByPedagogicalProgression,
  targetRefsForStep,
} from './candidate-helpers'
import { buildDailyCandidateSteps } from './daily-steps-builder'
import { resolveDiagnosticPrescriptionTarget } from './diagnostic-prescription'
import { buildImmersionLessonStep } from './immersion-step'
import { buildEdClusterDrillStep } from './ed-drill-step'
import { loadWatchedImmersionLessonIds } from '@/lib/immersion/progress-queries'
import { loadDailyChunkIntroStep, loadDueChunkReviewStep, loadPronunciationDifficultyChunkStep, markPronunciationDifficultyRouted } from '@/lib/chunk-of-day/queries'

export {
  buildReviewPlan,
  type BuildReviewPlanOptions,
  type ReviewPlan,
  shouldKeepNonExerciseStep,
}

/**
 * Repair drills for the error patterns due today. Seeded into production
 * generation so a past mistake comes back as a DIFFERENT task.
 */
export function constraintIdsForDuePatterns(
  queue: ErrorRecurrenceQueue | undefined,
  now: number = Date.now(),
): SpeechConstraintId[] {
  if (!queue) return []
  return duePatterns(queue, now)
    .map(repairConstraintFor)
    .filter((id): id is SpeechConstraintId => id !== null)
}

export async function buildDailyPlan(userId: string): Promise<DailyPlan> {
  const readCompletedLessons = async () => {
    const store = db.completedLessons as typeof db.completedLessons & {
      toArray?: () => Promise<Array<{ key: string; userId?: string; courseSlug?: string; lessonSlug?: string }>>
    }
    if (typeof store.where === 'function') {
      return store.where('userId').equals(userId).toArray()
    }
    return (await store.toArray?.() ?? []).filter((lesson) => lesson.userId === userId)
  }

  // Sounds catalog + word/sound queues + local learning state are independent — fetch in parallel.
  const [
    allSounds,
    newWords,
    dueWords,
    savedOrFamiliarWords,
    dueSounds,
    weakest,
    localLearningState,
    completedLessons,
    wordIndex,
  ] = await Promise.all([
    getAllSounds(),
    fetchNewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueReviewWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchSavedOrFamiliarWords(userId, WORD_REVIEW_WORD_COUNT),
    fetchDueSounds(userId),
    fetchWeakestSoundProgress(userId),
    db.learningState.get(userId).catch(() => null),
    readCompletedLessons().catch(() => []),
    getWordCategoryIndex(),
  ])

  const aiState = localLearningState?.state ?? null
  const hasProgress = weakest != null
  const activeLevel = localLearningState?.state.level.cefrEstimate.toLowerCase() as import('@/lib/courses/types').CefrLevelId | undefined
  const learnerLevel = normalizeCEFR(activeLevel ?? 'A1')
  const dueChunkStep = await loadDueChunkReviewStep(userId, 'daily', learnerLevel).catch(() => null)

  const dailyWordSelection = selectDailyReviewWords({
    newWords,
    dueWords,
    savedOrFamiliarWords,
    limit: WORD_REVIEW_WORD_COUNT,
    learnerLevel: activeLevel ? learnerLevel : undefined,
  })
  let reviewWords = dailyWordSelection.words
  const hasWordBank = reviewWords.length > 0
  const needsEssentialFallback = reviewWords.length === 0
  const completedLessonIds = new Set(completedLessons.map((lesson) => `${lesson.courseSlug}:${lesson.lessonSlug}`))
  const diagnosticTarget = await resolveDiagnosticPrescriptionTarget(userId, allSounds).catch(() => null)

  const primarySound = resolvePrimarySound(weakest, aiState, allSounds, diagnosticTarget?.sound)

  // Puente fonema ↔ vocabulario: sesga las palabras del word_bank hacia el sonido débil del día.
  if (primarySound && hasWordBank) {
    reviewWords = biasWordsBySound(reviewWords, primarySound.ipa, WORD_REVIEW_WORD_COUNT)
  }

  const repairConstraints = constraintIdsForDuePatterns(aiState?.errorRecurrence)

  // Solo los chunks due recortan la novedad de chunks. Contar aquí palabras y
  // sonidos due hacía que 6 palabras pendientes —trivial tras dos semanas—
  // dejaran el plan en 1 chunk nuevo permanente: el repaso de vocabulario
  // apagaba la introducción de expresiones.
  const dueChunkIntro = await loadDailyChunkIntroStep(
    userId,
    learnerLevel,
    dueChunkStep ? 1 : 0,
  ).catch(() => null)
  const dailyThreadChunks = [
    ...(dueChunkStep?.chunks ?? []),
    ...(dueChunkIntro?.chunks ?? []),
  ]
  if (needsEssentialFallback) {
    const anchoredWords = await fetchEssentialWordsForAnchors(
      dailyThreadChunks.flatMap((chunk) => chunk.contentGraph.anchors.map((anchor) => anchor.id)),
      WORD_REVIEW_WORD_COUNT,
    ).catch(() => [])
    reviewWords = anchoredWords.length > 0
      ? anchoredWords
      : await fetchEssentialWordsForDay(dayOfYear(), WORD_REVIEW_WORD_COUNT)
  }
  reviewWords = biasWordsByChunkAnchors(reviewWords, dailyThreadChunks)
  const pronunciationChunkStep = await loadPronunciationDifficultyChunkStep(userId, learnerLevel, allSounds).catch(() => null)

  // Paso correctivo: solo aparece con evidencia de error en algún cluster de -ed.
  // Compite por el único slot de producción, no se añade encima.
  const edDrillStep = await buildEdClusterDrillStep(userId).catch(() => null)

  const {
    steps: candidateSteps,
    grammarStep,
    studyDeckStep,
    weakTopic,
  } = await buildDailyCandidateSteps({
    userId,
    allSounds,
    primarySound,
    reviewWords,
    hasWordBank,
    hasProgress,
    activeLevel,
    completedLessonIds,
    aiState,
    savedOrFamiliarWordIds: dailyWordSelection.savedOrFamiliarIds,
    wordIndex,
  })

  const preferImmersionTopic = weakTopic ?? (studyDeckStep?.id ? studyDeckStep.id.replace(/^study_deck:/, '') : undefined)
  const watchedImmersionIds = await loadWatchedImmersionLessonIds(userId).catch(() => new Set<string>())
  const immersionStep = await buildImmersionLessonStep(activeLevel, watchedImmersionIds, dayOfYear(), preferImmersionTopic)

  let steps: DailyStep[] = [
    ...(dueChunkStep ? [dueChunkStep] : []),
    ...(dueChunkIntro ? [dueChunkIntro] : []),
    ...(pronunciationChunkStep ? [pronunciationChunkStep] : []),
    ...candidateSteps,
  ]
  const hasDueSrs = dueWords.length > 0 || dueSounds.length > 0 || dueChunkStep !== null

  if (hasDueSrs) {
    const hubPlan = await buildReviewPlan(userId, { dueWords, dueSounds })
    const hubPriority = hubPlan.steps.slice(0, 2)
    const usedIds = new Set(steps.map((s) => s.id))
    const toPrepend = hubPriority.filter((s) => !usedIds.has(s.id))
    steps = [...toPrepend, ...steps]
  }

  const rawPrimaryTarget = primarySound
    ? phonemeTargetId(`/${primarySound.ipa.replace(/^\/+|\/+$/g, '')}/`)
    : null
  const primaryTarget = rawPrimaryTarget && getTarget(rawPrimaryTarget).ok ? rawPrimaryTarget : null
  const mission = primaryTarget ? missionForTarget(primaryTarget) : null
  const missionStep: DailyStep | null = mission && primaryTarget
    ? {
        kind: 'mission',
        id: `mission:${mission.id}:${primaryTarget}`,
        title: 'Usa el foco en una conversación',
        subtitle: 'Misión oral con un objetivo exacto',
        icon: 'Messages',
        exercises: [],
        estMinutes: 5,
        missionLaunch: parseMissionLaunch({
          missionId: mission.id,
          targetIds: [primaryTarget],
          source: 'daily',
          stepId: `mission:${mission.id}:${primaryTarget}`,
        }),
      }
    : null

  const missionAllowedToday = shouldOfferMission(new Date().getDay(), true)

  const candidates = [
    // Antes que el resto de producción: con reason 'recent_error' gana el slot
    // frente a phoneme_focus/connected_speech, que entran como 'variety'.
    ...(edDrillStep ? [edDrillStep] : []),
    ...steps,
    ...(grammarStep ? [grammarStep] : []),
    ...(studyDeckStep ? [studyDeckStep] : []),
    ...(immersionStep ? [immersionStep] : []),
    ...(missionAllowedToday && missionStep ? [missionStep] : []),
  ].map((step) =>
    candidate(step, {
      reason: reasonForStep(step, {
        hasDueSrs,
        hasProgress,
        weakTopic,
        hasSavedOrFamiliar: dailyWordSelection.savedOrFamiliarIds.size > 0,
      }),
      targetRefs: targetRefsForStep(step, primaryTarget, primarySound),
      source: step.kind === 'mission' ? 'pronunciation_route' : step.kind,
      ...(step.kind === 'mission' ? { requiredCapability: 'speech_recognition' as const } : {}),
    }),
  )

  const targetPracticeCount = DAILY_PLAN_STEP_COUNT - 1
  let finalSteps = capPronunciationSteps(
    selectDailyCandidates(candidates, {
      limit: DAILY_PLAN_STEP_COUNT,
      availableCapabilities: new Set(['network', 'microphone', 'speech_recognition']),
      // Slots that always introduce new material, however large the backlog.
      reservedChunkNewSlots: RESERVED_CHUNK_NEW_SLOTS,
      // Review stays first in priority, but it stops being the whole session.
      maxDueSteps: MAX_DUE_STEPS,
    }),
  )

  if (finalSteps.length < targetPracticeCount) {
    const selectedIds = new Set(finalSteps.map((s) => s.id))
    for (const c of candidates) {
      if (finalSteps.length >= targetPracticeCount) break
      if (!selectedIds.has(c.step.id)) {
        const testCapped = capPronunciationSteps([...finalSteps, c.step])
        if (testCapped.length > finalSteps.length) {
          finalSteps = testCapped
          selectedIds.add(c.step.id)
        }
      }
    }
  }

  if (shouldOfferJournalStep(dayOfYear()) && !finalSteps.some((step) => step.id === 'journal_entry')) {
    finalSteps = [...finalSteps, buildJournalDailyStep()]
  }

  const seenContent = new Set<string>()
  const dedupedFinalSteps = finalSteps.map((step) => {
    const exercises = step.exercises.filter((ex) => {
      const key = getSemanticContentKey(ex)
      if (seenContent.has(key)) return false
      seenContent.add(key)
      return true
    })
    return { ...step, exercises }
  })

  const arcTopics = dedupedFinalSteps.flatMap((s) =>
    s.exercises.map((e) => (e.payload.kind === 'generic' ? e.payload.data.topic : undefined)),
  )
  const sessionWords = Array.from(new Set(reviewWords.map((w) => w.text).filter((t): t is string => !!t)))
  const diagnosticPrescription = diagnosticTarget?.sound && primarySound?.ipa === diagnosticTarget.sound.ipa
    ? { soundIpa: diagnosticTarget.sound.ipa, dayIndex: diagnosticTarget.dayIndex + 1, totalDays: 5, reason: diagnosticTarget.session.reason }
    : null
  const journalRepairs = repairConstraints.length > 0
    ? { count: repairConstraints.length, patterns: repairConstraints }
    : null
  const arc: SessionArc = {
    topicLabel: dominantTopicLabel(arcTopics),
    soundIpa: primarySound?.ipa ?? null,
    sessionWords,
    diagnosticPrescription,
    journalRepairs,
  }

  const totalExercises = dedupedFinalSteps.reduce((sum, s) => sum + s.exercises.length, 0)
  for (const step of dedupedFinalSteps) {
    if (step.pronunciationDifficultyWordId) {
      await markPronunciationDifficultyRouted(userId, step.pronunciationDifficultyWordId).catch(() => undefined)
    }
  }
  const contentMix = dedupedFinalSteps.reduce((mix, step) => {
    if (step.kind === 'chunk_intro' || step.kind === 'chunk_review') {
      mix.chunkActions += step.exercises.length + (step.chunks?.length ?? 0)
    } else if (step.kind === 'word_intro' || step.kind === 'word_review' || step.kind === 'context_practice'
      || step.kind === 'phoneme_focus' || step.kind === 'minimal_pairs' || step.kind === 'listening') {
      mix.wordOrSoundActions += step.exercises.length + (step.studyCards?.length ?? 0)
    } else {
      mix.otherActions += step.exercises.length
    }
    return mix
  }, { chunkActions: 0, wordOrSoundActions: 0, otherActions: 0 })

  return {
    steps: sortStepsByPedagogicalProgression(dedupedFinalSteps),
    totalExercises,
    isNewUser: !hasWordBank && !hasProgress,
    arc,
    contentMix,
  }
}
