'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { canEvaluateProduction } from '@/lib/pronunciation/assessment/capability'
import { getLearnerTargetCopy } from '@/lib/pronunciation/assessment/learner-copy'
import { scorePerceptionPrompt, scoreProductionPrompt } from '@/lib/pronunciation/assessment/scoring'
import type { PerceptionAnswer } from '@/lib/pronunciation/assessment/scoring'
import type { DiagnosticPromptSelection } from '@/lib/pronunciation/assessment/prompt-selection'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { CapabilitySnapshot, TargetResult } from '@/lib/pronunciation/assessment/types'
import type { WordStressPerceptionItem } from '@/lib/pronunciation/assessment/word-stress-perception'
import { PronunciationPerceptionPrompt } from './PronunciationPerceptionPrompt'
import { PronunciationProductionPrompt } from './PronunciationProductionPrompt'

interface PronunciationPromptFlowProps {
  userId: string
  selections: DiagnosticPromptSelection[]
  capabilitySnapshot: CapabilitySnapshot
  onComplete: (targetResults: TargetResult[]) => void
  /** Word-stress items sampled for this run; forwarded to the perception prompt. */
  wordStressItems?: readonly WordStressPerceptionItem[]
}

function skippedProductionAttempt(
  userId: string,
  selection: DiagnosticPromptSelection
): SpokenAttempt {
  const { title, speakCue } = getLearnerTargetCopy(selection.targetId)
  return {
    userId,
    targetText: speakCue ?? title,
    transcript: '',
    evaluatorVersion: 'diagnostic-stt-v1',
    scoreKind: 'stt_intelligibility',
    overallScore: 0,
    targetId: selection.targetId,
    durationMs: 0,
    outcome: 'skipped',
  }
}

/**
 * Iterates through the selected diagnostic prompts one at a time, scoring
 * each via the existing pure scoring functions (step 4) and accumulating
 * `TargetResult[]`. When production cannot be evaluated (mic/STT), production
 * prompts are auto-skipped — the learner only sees perception questions.
 */
export function PronunciationPromptFlow({
  userId,
  selections,
  capabilitySnapshot,
  onComplete,
  wordStressItems,
}: PronunciationPromptFlowProps) {
  const canProduce = canEvaluateProduction(capabilitySnapshot)
  const activeSelections = useMemo(
    () => (canProduce ? selections : selections.filter((s) => s.stage === 'perception')),
    [canProduce, selections]
  )

  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<TargetResult[]>([])
  const finishedEmptyRef = useRef(false)

  const current = activeSelections[index]
  const total = activeSelections.length
  const questionNumber = index + 1
  const progressRatio = total ? questionNumber / total : 0

  const isPerception = useMemo(() => current?.stage === 'perception', [current])

  function finish(activeResults: TargetResult[]) {
    if (canProduce) {
      onComplete(activeResults)
      return
    }

    let activeIdx = 0
    const merged = selections.map((selection) => {
      if (selection.stage === 'perception') {
        const scored = activeResults[activeIdx]
        activeIdx += 1
        return scored ?? scorePerceptionPrompt(selection, null)
      }
      return scoreProductionPrompt(selection, skippedProductionAttempt(userId, selection))
    })
    onComplete(merged)
  }

  function advance(result: TargetResult) {
    const next = [...results, result]
    if (index + 1 >= total) {
      finish(next)
      return
    }
    setResults(next)
    setIndex((i) => i + 1)
  }

  function goBack() {
    if (index <= 0) return
    setResults((prev) => prev.slice(0, -1))
    setIndex((i) => i - 1)
  }

  function handlePerceptionAnswer(answer: PerceptionAnswer | null) {
    if (!current) return
    advance(scorePerceptionPrompt(current, answer))
  }

  function handleProductionAttempt(attempt: SpokenAttempt) {
    if (!current) return
    advance(scoreProductionPrompt(current, attempt))
  }

  useEffect(() => {
    if (total > 0 || finishedEmptyRef.current) return
    finishedEmptyRef.current = true
    finish([])
  }, [total])

  if (!current) return null

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <p className="font-body-sm text-fg-muted" aria-live="polite">
            Pregunta{' '}
            <strong className="tabular-nums font-semibold text-fg">{questionNumber}</strong> de{' '}
            {total}
          </p>
          {index > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-11 shrink-0 text-fg-subtle"
              onClick={goBack}
            >
              Anterior
            </Button>
          ) : null}
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={questionNumber}
          aria-label={`Pregunta ${questionNumber} de ${total}`}
          className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
        >
          <span
            className="block h-full origin-left rounded-full bg-cta-bg transition-transform duration-200 ease-out-quart motion-reduce:transition-none"
            style={{ transform: `scaleX(${progressRatio})` }}
          />
        </div>
      </div>

      {isPerception ? (
        <PronunciationPerceptionPrompt
          key={current.targetId}
          selection={current}
          onAnswer={handlePerceptionAnswer}
          wordStressItems={wordStressItems}
        />
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
