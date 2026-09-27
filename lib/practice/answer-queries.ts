import type { Json } from '@/lib/supabase/types'
import { answerToGrade } from './grade'
import { enqueueWordBankSRSUpdate } from '@/lib/word-bank/srs-queries'
import { canonicalTopic } from '@/lib/topic-catalog'
import { normalizeTopic } from './normalize-topic'
import { enqueueTopicSRSUpdate } from './topic-srs-queries'
import { upsertFragmentSrs } from './fragment-srs'
import { upsertChunkSrs } from '@/lib/chunk-of-day/srs'
import { ATTRIBUTION_VERSION, mergeAttributionIntoPayload } from './attribution'
import { isUuid } from '@/lib/review/content-ref'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import { recordPracticeErrorRecurrence } from './error-recurrence-sync'
import { evidenceModalityForExercise } from './resolve-attribution'
import { recordChunkEvidence } from '@/lib/chunk-of-day/evidence'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'
import type { PracticeAnswer } from './types'
import { practiceEffectId } from './attempt-identity'

export async function savePracticeAnswer(
  userId: string,
  answer: PracticeAnswer,
): Promise<void> {
  // Exercises with no exerciseTypeId (e.g. reader exposure) are not tracked in answer_history.
  if (answer.exerciseTypeId === null) return

  // Phoneme exercises forward their targetWord via exercisePayload.targetWord
  // when the adapter constructs the PhonemePayload. Pull it out for the
  // dedicated column when present.
  const payload = answer.exercisePayload as
    | { targetWord?: string }
    | null
    | undefined
  const targetWord = payload?.targetWord ?? null

  // Prefer a prefixed content_id when sourceRef is present so SRS queries can
  // filter by source without joining. Format: "<source>:<id>" (e.g. "word_bank:abc-123").
  const contentId = answer.sourceRef
    ? `${answer.sourceRef.source}:${answer.sourceRef.id}`
    : answer.contentId

  const normalizedTopic = answer.topic ? normalizeTopic(answer.topic) : null
  const canonicalSrsTopic = canonicalTopic(normalizedTopic)

  const attribution = answer.attribution
  const attributionVersion = attribution
    ? (answer.attributionVersion ?? ATTRIBUTION_VERSION)
    : undefined
  const exercisePayload = mergeAttributionIntoPayload(
    {
      ...(answer.exercisePayload && typeof answer.exercisePayload === 'object' ? answer.exercisePayload : {}),
      ...(answer.status ? { status: answer.status } : {}),
      ...(answer.responseTimeMs != null ? { responseTimeMs: answer.responseTimeMs } : {}),
      ...(answer.totalInteractionMs != null ? { totalInteractionMs: answer.totalInteractionMs } : {}),
      ...(answer.firstTryFailed != null ? { firstTryFailed: answer.firstTryFailed } : {}),
      ...(answer.hintsUsed != null ? { hintsUsed: answer.hintsUsed } : {}),
      ...(answer.score != null ? { score: answer.score } : {}),
      ...(answer.responseTimeKnown != null ? { responseTimeKnown: answer.responseTimeKnown } : {}),
    },
    attribution,
    attributionVersion,
  )

  const grade = answerToGrade(answer)
  const isAnswered = (answer.status === 'answered' || (answer.status === undefined && answer.userAnswer !== 'skip')) && grade !== null

  // Hash before opening IndexedDB: WebCrypto can expire an active transaction.
  const attemptId = answer.attemptId ?? crypto.randomUUID()
  const [answerId, wordEffectId, topicEffectId] = await Promise.all([
    practiceEffectId(userId, attemptId, 'attempt', '', 'answer'),
    practiceEffectId(userId, attemptId, 'word_bank', answer.sourceRef?.id ?? '', 'rating'),
    practiceEffectId(userId, attemptId, 'topic_srs', canonicalSrsTopic ?? '', 'rating'),
  ])
  const row = {
    id: answerId,
    user_id: userId,
    sound_id: answer.soundId ?? null,
    exercise_type_id: answer.exerciseTypeId,
    is_correct: isAnswered ? answer.isCorrect : false,
    user_answer: answer.userAnswer ?? null,
    target_word: targetWord,
    time_ms: answer.responseTimeMs ?? answer.timeMs,
    exercise_payload: (Object.keys(exercisePayload).length > 0
      ? exercisePayload
      : null) as Json | null,
    context: answer.context,
    content_id: contentId,
    topic: normalizedTopic,
  }

  const rowWithGrade = { ...row, grade }

  await db.transaction('rw', [db.syncOutbox, db.srsRatingEvents, db.srsData,
    db.practiceAttemptReceipts, db.chunkEvidence, db.learningState], async () => {
    if (await db.practiceAttemptReceipts.get(answerId)) return
    await enqueue(userId, 'answer_history', 'upsert', rowWithGrade as Record<string, unknown>, undefined, 'id')

    // Explicit non-SRS attribution, non-answered status (skips, evaluator failures), or null grade blocks SRS updates.
    const allowSrs = attribution?.srsEligible !== false && isAnswered && grade !== null
    const wordBankOutcome = attribution?.srsEligible === true
      ? attribution.outcomes.find(
          (outcome) => outcome.target.namespace === 'word_bank'
            && outcome.target.id === answer.sourceRef?.id,
        )
      : undefined
    const topicOutcome = attribution?.srsEligible === true
      ? attribution.outcomes.find(
          (outcome) => outcome.target.namespace === 'topic'
            && outcome.target.id === normalizedTopic,
        )
      : undefined
    const sourceTargetIsExplicitlyDifferent = attribution !== undefined
      && attribution.srsEligible === true
      && !wordBankOutcome

    // Enqueue SRS update for word_bank entries via the sync outbox (retried on reconnection).
    // Guard: only real UUIDs — catalog/lexicon ids must never hit word_bank PK.
    if (
      allowSrs
      && !sourceTargetIsExplicitlyDifferent
      && answer.sourceRef?.source === 'word_bank'
      && isUuid(answer.sourceRef.id)
    ) {
      await enqueueWordBankSRSUpdate(userId, answer.sourceRef.id, grade, {
        signal: 'objective_evidence',
        modality: wordBankOutcome?.modality ?? 'meaning_recall',
        attributionVersion: attributionVersion ?? ATTRIBUTION_VERSION,
      }, wordEffectId)
    } else if (allowSrs && answer.sourceRef?.source === 'text_fragments') {
      await upsertFragmentSrs(userId, answer.sourceRef.id, grade)
    } else if (allowSrs && answer.sourceRef?.source === 'chunks') {
      await upsertChunkSrs(userId, answer.sourceRef.id, grade)
    }

    // Enqueue SRS update for the concept (topic) when the exercise carries one.
    if (allowSrs && normalizedTopic && (!attribution || topicOutcome)) {
      await enqueueTopicSRSUpdate(userId, normalizedTopic, grade, { idempotencyKey: topicEffectId })
    }

    if (isAnswered && answer.isCorrect && answer.sourceRef?.source === 'chunks') {
      await recordChunkEvidence(
        userId,
        answer.sourceRef.id,
        evidenceModalityForExercise(answer),
      )
    }

    const epPayload = answer.exercisePayload as {
      errorPattern?: ErrorPatternId
      rehearsedPattern?: ErrorPatternId
    } | null

    if (epPayload?.errorPattern || epPayload?.rehearsedPattern) {
      await recordPracticeErrorRecurrence(
        userId,
        epPayload.errorPattern,
        epPayload.rehearsedPattern,
        isAnswered ? answer.isCorrect : false,
        true,
      )
    }
    await db.practiceAttemptReceipts.add({ id: answerId, userId, attemptId, createdAt: new Date().toISOString() })
  })
}
