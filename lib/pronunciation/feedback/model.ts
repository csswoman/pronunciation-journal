import { prioritizeFeedbackTarget } from './prioritize'
import type {
  FeedbackOutcome,
  FeedbackTargetCandidate,
  PronunciationFeedbackModel,
  PronunciationFeedbackSignal,
} from './types'

export interface BuildPronunciationFeedbackInput {
  signal: PronunciationFeedbackSignal
  candidates?: readonly FeedbackTargetCandidate[]
  previous?: Pick<PronunciationFeedbackModel, 'signal' | 'priority'>
}

function isComparable(
  previous: PronunciationFeedbackModel['signal'] | undefined,
  current: PronunciationFeedbackSignal,
): boolean {
  return !!previous
    && previous.kind !== 'unscored'
    && current.kind !== 'unscored'
    && previous.kind === current.kind
    && previous.evaluatorVersion === current.evaluatorVersion
}

function scoreOf(signal: PronunciationFeedbackSignal): number | null {
  return signal.kind === 'stt_intelligibility' ? signal.recognizedPercent : null
}

function summaryFor(signal: PronunciationFeedbackSignal, hasPriority: boolean): string {
  if (signal.kind === 'unscored') return 'No pudimos evaluar este intento. Prueba a grabarlo otra vez.'
  if (signal.kind === 'stt_intelligibility') {
    return hasPriority
      ? 'Comparamos el texto que entendió el reconocimiento de voz y elegimos un foco para repetir.'
      : 'El reconocimiento de voz entendió parte de la frase. Necesitamos otro intento para señalar un foco fiable.'
  }
  return hasPriority
    ? 'Usamos el texto reconocido para proponer un contraste de práctica; no es una medición acústica.'
    : 'El texto reconocido no ofrece evidencia suficiente para una corrección concreta.'
}

export function buildPronunciationFeedback(
  input: BuildPronunciationFeedbackInput,
): PronunciationFeedbackModel {
  const priority = input.signal.kind === 'unscored'
    ? null
    : prioritizeFeedbackTarget(input.candidates ?? [])
  const comparable = isComparable(input.previous?.signal, input.signal)
  const previousPriority = input.previous?.priority?.targetId
  const previousScore = input.previous ? scoreOf(input.previous.signal) : null
  const currentScore = scoreOf(input.signal)
  const outcome: FeedbackOutcome = input.signal.kind === 'unscored'
    ? 'unscored'
    : !priority || !comparable || previousPriority !== priority.targetId || previousScore === null || currentScore === null
      ? 'needs_more_evidence'
      : currentScore > previousScore
        ? 'improved'
        : 'same'

  return {
    version: 1,
    signal: input.signal,
    outcome,
    priority,
    summaryEs: summaryFor(input.signal, !!priority),
    reviewRecommended: outcome === 'same' || outcome === 'needs_more_evidence',
  }
}
