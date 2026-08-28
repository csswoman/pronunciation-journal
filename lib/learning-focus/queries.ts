'use client'

import { getUserLearningState } from '@/lib/ai-practice/load-state'
import { persistLearningState } from '@/lib/ai-practice/queries'
import type { UserLearningState } from '@/lib/ai-practice/learning-state'
import { mergeConceptSignals } from '@/lib/courses/assessment-profile'
import type { AssessmentConcept, ConceptSignal } from '@/lib/courses/concept-profile'
import { db, ensureDbReady } from '@/lib/db'
import { buildManualConceptSignal, buildTheoryClaimSignal, type ManualSignalOption } from './claims'
import { deriveSuggestedFocus, type DeriveSuggestedFocusInput } from './derive-suggested-focus'
import { getEffectiveFocus } from './effective-focus'
import type { FocusLevel, FocusThread, LearningFocus } from './types'

async function readState(userId: string): Promise<UserLearningState> {
  await ensureDbReady()
  const local = await db.learningState.get(userId)
  return local?.state ?? (await getUserLearningState(userId))
}

function threadsEqual(a: FocusThread | null, b: FocusThread | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  if (a.kind === 'theory' && b.kind === 'theory') {
    return a.topicId === b.topicId
  }
  if (a.kind === 'sound' && b.kind === 'sound') {
    return a.key === b.key
  }
  return false
}

function suggestedEquals(
  a: LearningFocus['suggested'],
  b: LearningFocus['suggested'],
): boolean {
  return (
    a.level === b.level &&
    a.source === b.source &&
    threadsEqual(a.thread, b.thread)
  )
}

function ensureFocus(state: UserLearningState, nowIso: string): LearningFocus {
  if (state.focus) return state.focus
  const suggested = deriveSuggestedFocus({
    profileLevel: state.level.cefrEstimate,
    routeLevel: null,
    recentTheoryLessonSlug: null,
    weakSoundKey: null,
  })
  return {
    level: suggested.level,
    thread: null,
    pinned: false,
    suggested,
    source: suggested.source,
    updatedAt: nowIso,
  }
}

export async function loadLearningFocus(userId: string): Promise<LearningFocus | null> {
  const state = await readState(userId)
  return state.focus ?? null
}

export async function saveLearningFocus(userId: string, focus: LearningFocus): Promise<void> {
  const state = await readState(userId)
  await persistLearningState(userId, {
    ...state,
    userId,
    focus,
    updatedAt: focus.updatedAt,
  })
}

export async function pinFocus(
  userId: string,
  override: { level: FocusLevel; thread: FocusThread | null },
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const next: LearningFocus = {
    ...current,
    level: override.level,
    thread: override.thread,
    pinned: true,
    source: 'manual',
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function releaseFocusPin(
  userId: string,
  input: DeriveSuggestedFocusInput,
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const suggested = deriveSuggestedFocus(input)
  const next: LearningFocus = {
    ...current,
    pinned: false,
    suggested,
    source: suggested.source,
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function refreshSuggestedFocus(
  userId: string,
  input: DeriveSuggestedFocusInput,
): Promise<LearningFocus> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const current = ensureFocus(state, nowIso)
  const suggested = deriveSuggestedFocus(input)
  if (state.focus && suggestedEquals(current.suggested, suggested)) {
    return current
  }
  const next: LearningFocus = {
    ...current,
    suggested,
    source: current.pinned ? current.source : suggested.source,
    updatedAt: nowIso,
  }
  await persistLearningState(userId, { ...state, userId, focus: next, updatedAt: nowIso })
  return next
}

export async function claimTheoryTopics(
  userId: string,
  concepts: AssessmentConcept[],
): Promise<void> {
  const nowIso = new Date().toISOString()
  const state = await readState(userId)
  const existing = state.theory?.concepts ?? []
  const mastered = new Set(
    existing.filter((c) => c.status === 'mastered').map((c) => c.lessonSlug),
  )
  const incoming = concepts
    .filter((c) => !mastered.has(c.lessonSlug))
    .map((concept) => buildTheoryClaimSignal(concept, nowIso))
  const next: UserLearningState = {
    ...state,
    userId,
    updatedAt: nowIso,
    theory: {
      concepts: mergeConceptSignals(existing, incoming),
    },
  }
  await persistLearningState(userId, next)
}

export async function listClaimedTheoryTopics(userId: string): Promise<ConceptSignal[]> {
  const state = await readState(userId)
  return (state.theory?.concepts ?? []).filter(
    (c) => c.selfRating === 'familiar' || c.selfRating === 'confident' || c.status === 'review',
  )
}

export async function saveManualConceptSignal(
  userId: string,
  concept: Pick<AssessmentConcept, 'lessonSlug' | 'level' | 'title'>,
  option: ManualSignalOption,
): Promise<void> {
  const nowIso = new Date().toISOString()
  const signal = buildManualConceptSignal(concept, option, nowIso)
  const state = await readState(userId)
  const existing = state.theory?.concepts ?? []
  const next: UserLearningState = {
    ...state,
    userId,
    updatedAt: nowIso,
    theory: {
      concepts: mergeConceptSignals(existing, [signal]),
    },
  }
  await persistLearningState(userId, next)
}

export async function getEffectiveFocusForUser(userId: string) {
  const focus = await loadLearningFocus(userId)
  if (!focus) return null
  return getEffectiveFocus(focus)
}
