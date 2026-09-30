import type { PracticeResultStatus, PracticeSubmitExtras } from './types'

/** Producers may use resultStatus; the session consumes only canonical status. */
export type ProducerSubmitExtras = PracticeSubmitExtras & {
  resultStatus?: PracticeResultStatus
}

const STATUS_PRECEDENCE: PracticeResultStatus[] = ['skipped', 'evaluator_failed', 'unscored', 'answered']

/** A non-evaluated signal always wins over answered; absence is legacy answered. */
export function normalizeSubmitEvidence(
  extras: ProducerSubmitExtras | undefined,
  userAnswer: string,
): PracticeSubmitExtras & { status: PracticeResultStatus } {
  const { resultStatus, ...canonical } = extras ?? {}
  const status = userAnswer === 'skip' ? 'skipped' : STATUS_PRECEDENCE.find(
    candidate => candidate === canonical.status || candidate === resultStatus,
  ) ?? 'answered'
  return { ...canonical, status }
}
