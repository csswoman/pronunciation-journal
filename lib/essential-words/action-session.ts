import { modeHasData, selectMode, type EssentialWordMode } from './exercise-modes'
import { estimateDurationMs } from './session-plan-time-ceiling'
import { essentialWordId, type EssentialWord } from './types'

export type SessionActionSource = 'continuation' | 'review' | 'new'

export interface SessionAction {
  id: string
  wordId: string
  source: SessionActionSource
  kind: 'exposure' | 'exercise'
  level?: 1 | 2 | 3
  mode?: EssentialWordMode
  final?: boolean
  fromSnooze?: boolean
}

export interface SessionCandidate {
  entry: EssentialWord
  source: SessionActionSource
  repetitions?: number
  forcedMode?: EssentialWordMode
  fromSnooze?: boolean
  resumeFromLevel?: 1 | 2 | 3 | 'final'
  includeExposure?: boolean
}

export interface ActionSessionState {
  actionBudget: number
  completedActions: number
  pending: SessionAction[]
  reserve: SessionAction[]
  claimedKnownWordIds: string[]
}

export interface EssentialWordsSessionPreview {
  actionBudget: number
  scheduledActions: number
  uniqueWords: number
  newWordCount: number
  reviewActionCount: number
  continuationActionCount: number
  estimatedDurationMs: number
  completedActions: number
  remainingActions: number
}

function exerciseMode(entry: EssentialWord, level: 1 | 2 | 3): EssentialWordMode {
  const repetitions = level === 1 ? 0 : level === 2 ? 3 : 6
  return selectMode({ kind: 'review', entry, repetitions })
}

function finalMode(entry: EssentialWord): EssentialWordMode {
  return modeHasData(entry, 'cloze_sentence') ? 'cloze_sentence' : 'speak_sentence'
}

function newSequence(candidate: SessionCandidate): SessionAction[] {
  const wordId = essentialWordId(candidate.entry.word)
  const start = candidate.resumeFromLevel ?? 1
  if (start === 'final') {
    return [{
      id: `continuation:${wordId}:final`, wordId, source: 'continuation', kind: 'exercise',
      level: 3, mode: finalMode(candidate.entry), final: true,
    }]
  }

  const source = candidate.source === 'new' ? 'new' : 'continuation'
  const actions: SessionAction[] = []
  if (candidate.includeExposure !== false && start === 1) {
    actions.push({ id: `${source}:${wordId}:exposure`, wordId, source, kind: 'exposure' })
  }
  for (const level of [1, 2, 3] as const) {
    if (level < start) continue
    actions.push({
      id: `${source}:${wordId}:level:${level}`,
      wordId,
      source,
      kind: 'exercise',
      level,
      mode: exerciseMode(candidate.entry, level),
    })
  }
  actions.push({
    id: `${source}:${wordId}:final`, wordId, source, kind: 'exercise',
    level: 3, mode: finalMode(candidate.entry), final: true,
  })
  return actions
}

function reviewAction(candidate: SessionCandidate): SessionAction {
  const wordId = essentialWordId(candidate.entry.word)
  return {
    id: `review:${wordId}`,
    wordId,
    source: 'review',
    kind: 'exercise',
    level: 3,
    mode: candidate.forcedMode ?? selectMode({
      kind: 'review',
      entry: candidate.entry,
      repetitions: candidate.repetitions,
    }),
    fromSnooze: candidate.fromSnooze,
  }
}

export function createActionSession(
  candidates: readonly SessionCandidate[],
  actionBudget: number,
): ActionSessionState {
  const seen = new Set<string>()
  const ordered = [...candidates].sort((a, b) => {
    const priority = { continuation: 0, review: 1, new: 2 } as const
    return priority[a.source] - priority[b.source]
  })
  const actions: SessionAction[] = []
  for (const candidate of ordered) {
    const wordId = essentialWordId(candidate.entry.word)
    if (seen.has(wordId)) continue
    seen.add(wordId)
    actions.push(...(candidate.source === 'review' ? [reviewAction(candidate)] : newSequence(candidate)))
  }

  const budget = Math.max(0, Math.floor(actionBudget))
  return {
    actionBudget: budget,
    completedActions: 0,
    pending: actions.slice(0, budget),
    reserve: actions.slice(budget),
    claimedKnownWordIds: [],
  }
}

function fillFromReserve(state: ActionSessionState): ActionSessionState {
  const remainingSlots = Math.max(0, state.actionBudget - state.completedActions)
  if (state.pending.length >= remainingSlots || state.reserve.length === 0) return state
  const needed = remainingSlots - state.pending.length
  return {
    ...state,
    pending: [...state.pending, ...state.reserve.slice(0, needed)],
    reserve: state.reserve.slice(needed),
  }
}

export function completeCurrentAction(
  state: ActionSessionState,
  options: { retry?: boolean } = {},
): ActionSessionState {
  const current = state.pending[0]
  if (!current) return state
  const completedActions = Math.min(state.actionBudget, state.completedActions + 1)
  let pending = state.pending.slice(1)
  let reserve = state.reserve

  if (options.retry && completedActions < state.actionBudget) {
    const retry: SessionAction = {
      ...current,
      id: `${current.id}:retry:${completedActions}`,
      source: current.source === 'review' ? 'review' : 'continuation',
    }
    const insertAt = Math.min(2, pending.length)
    pending = [...pending.slice(0, insertAt), retry, ...pending.slice(insertAt)]
  }

  const remainingSlots = Math.max(0, state.actionBudget - completedActions)
  if (pending.length > remainingSlots) {
    reserve = [...pending.slice(remainingSlots), ...reserve]
    pending = pending.slice(0, remainingSlots)
  }

  return fillFromReserve({ ...state, completedActions, pending, reserve })
}

export function removeWordFromActionSession(
  state: ActionSessionState,
  wordId: string,
): ActionSessionState {
  return fillFromReserve({
    ...state,
    pending: state.pending.filter((action) => action.wordId !== wordId),
    reserve: state.reserve.filter((action) => action.wordId !== wordId),
    claimedKnownWordIds: state.claimedKnownWordIds.filter((id) => id !== wordId),
  })
}

export function claimKnownInActionSession(
  state: ActionSessionState,
  wordId: string,
  mode: EssentialWordMode,
): ActionSessionState {
  const verification: SessionAction = {
    id: `known:${wordId}:verify`, wordId, source: 'continuation', kind: 'exercise',
    level: 3, mode, final: true,
  }
  const available = [...state.pending, ...state.reserve]
    .filter((action) => action.wordId !== wordId)
  const remainingSlots = Math.max(0, state.actionBudget - state.completedActions)
  const regularSlots = Math.max(0, remainingSlots - 1)
  const pending = remainingSlots > 0
    ? [...available.slice(0, regularSlots), verification]
    : []
  return {
    ...state,
    pending,
    reserve: available.slice(regularSlots),
    claimedKnownWordIds: [...state.claimedKnownWordIds.filter((id) => id !== wordId), wordId],
  }
}

export function deriveActionSessionPreview(state: ActionSessionState): EssentialWordsSessionPreview {
  const actions = state.pending
  const wordIds = new Set(actions.map((action) => action.wordId))
  const newIds = new Set(actions.filter((action) => action.source === 'new').map((action) => action.wordId))
  const exposureCount = actions.filter((action) => action.kind === 'exposure').length
  const exerciseCount = actions.length - exposureCount
  return {
    actionBudget: state.actionBudget,
    scheduledActions: state.completedActions + actions.length,
    uniqueWords: wordIds.size,
    newWordCount: newIds.size,
    reviewActionCount: actions.filter((action) => action.source === 'review').length,
    continuationActionCount: actions.filter((action) => action.source === 'continuation').length,
    estimatedDurationMs: estimateDurationMs({ exposeCount: exposureCount, exerciseCount }),
    completedActions: state.completedActions,
    remainingActions: actions.length,
  }
}
