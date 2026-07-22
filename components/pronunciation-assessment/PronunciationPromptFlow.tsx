'use client'

import { useMemo, useState } from 'react'
import { scorePerceptionPrompt, scoreProductionPrompt } from '@/lib/pronunciation/assessment/scoring'
import type { PerceptionAnswer } from '@/lib/pronunciation/assessment/scoring'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { TargetResult } from '@/lib/pronunciation/assessment/types'
import { PronunciationPerceptionPrompt } from './PronunciationPerceptionPrompt'
import { PronunciationProductionPrompt } from './PronunciationProductionPrompt'

interface PronunciationPromptFlowProps {
  userId: string
  selections: DiagnosticPromptSelection[]
  onComplete: (targetResults: TargetResult[]) => void
}

/**
 * Iterates through the selected diagnostic prompts one at a time, scoring
 * each via the existing pure scoring functions (step 4) and accumulating
 * `TargetResult[]`. Minimal, functional UI — see step 7 spec: emphasis is
 * the results experience, not prompt-taking polish.
 */
export function PronunciationPromptFlow({ userId, selections, onComplete }: PronunciationPromptFlowProps) {
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<TargetResult[]>([])

  const current = selections[index]
  const total = selections.length
  const progressValue = index

  const isPerception = useMemo(() => current?.stage === 'perception', [current])

  function advance(result: TargetResult) {
    const next = [...results, result]
    if (index + 1 >= total) {
      onComplete(next)
      return
    }
    setResults(next)
    setIndex((i) => i + 1)
  }

  function handlePerceptionAnswer(answer: PerceptionAnswer | null) {
    if (!current) return
    advance(scorePerceptionPrompt(current, answer))
  }

  function handleProductionAttempt(attempt: SpokenAttempt) {
    if (!current) return
    advance(scoreProductionPrompt(current, attempt))
  }

  if (!current) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="assessment-progress-copy flex items-center gap-1 text-[13px] text-[var(--text-secondary)]" aria-live="polite">
          <strong className="text-[var(--text-primary)]">{progressValue}</strong>
          <span>de {total}</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={progressValue}
          aria-label="Preguntas del diagnóstico completadas"
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-sunken)]"
        >
          <span
            className="block h-full origin-left rounded-full bg-[var(--cta-bg)]"
            style={{ transform: `scaleX(${total ? progressValue / total : 0})` }}
          />
        </div>
      </div>

      {isPerception ? (
        <PronunciationPerceptionPrompt key={current.targetId} selection={current} onAnswer={handlePerceptionAnswer} />
      ) : (
        <PronunciationProductionPrompt
          key={current.targetId}
          userId={userId}
          selection={current}
          onAttempt={handleProductionAttempt}
        />
      )}
    </div>
  )
}
