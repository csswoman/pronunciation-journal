'use client'

import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { isActionablePronunciationFeedbackCopyEnabled } from '@/lib/pronunciation/feedback/copy-flag'

interface MissionFeedbackTargetProps {
  targetEvidence: MissionOutcome['targetEvidence']
}

export function MissionFeedbackTarget({ targetEvidence }: MissionFeedbackTargetProps) {
  if (!isActionablePronunciationFeedbackCopyEnabled()) return null

  const focus = targetEvidence.find((evidence) => evidence.outcome !== 'unscored')
  if (!focus) return null

  const copy = getLearnerTargetCopy(focus.targetId)
  return (
    <section className="rounded-md border border-border-subtle bg-surface-raised px-4 py-3">
      <p className="m-0 font-kicker text-fg-subtle">SIGUIENTE FOCO</p>
      <p className="mb-0 mt-1 text-body-sm text-fg">
        {copy.title}. Basado en lo que entendió el reconocimiento de voz; no mide la precisión del sonido.
      </p>
    </section>
  )
}
