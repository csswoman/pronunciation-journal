'use client'

// Planned structure:
// <PronunciationAssessmentClient>
//   <PronunciationAssessmentChrome />
//   <CapabilityPreflight />
//   <PronunciationPromptFlow />
//   <FinishErrorRecovery />
//   <PronunciationResults />
// </PronunciationAssessmentClient>

import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import Button from '@/components/ui/Button'
import {
  PronunciationAssessmentChrome,
  type AssessmentChromeStage,
} from './PronunciationAssessmentChrome'
import { CapabilityPreflight } from './CapabilityPreflight'
import { PronunciationPromptFlow } from './PronunciationPromptFlow'
import { PronunciationResults } from './PronunciationResults'
import { applyPriorityStatus, derivePriorityTargetIds } from '@/lib/pronunciation/assessment/prioritization'
import { generatePrescriptionSessions } from '@/lib/pronunciation/assessment/prescription'
import { selectDiagnosticPrompts } from '@/lib/pronunciation/assessment/prompt-selection'
import { sampleWordStressItems } from '@/lib/pronunciation/assessment/word-stress-perception'
import { persistPronunciationAssessmentLocal } from '@/lib/pronunciation/assessment/persistence'
import { saveGuestPronunciationDiagnostic } from '@/lib/pronunciation/assessment/guest-transfer'
import { validateDiagnosticResult } from '@/lib/pronunciation/assessment/schema'
import type { CapabilitySnapshot, TargetResult } from '@/lib/pronunciation/assessment/types'
import type { PronunciationDiagnosticResult } from '@/lib/pronunciation/assessment/schema'

interface PronunciationAssessmentClientProps {
  userId?: string
}

type Stage = 'preflight' | 'prompts' | 'results'

const DEFAULT_CEFR = 'A2' as const

function chromeStage(stage: Stage, finishError: boolean): AssessmentChromeStage {
  if (finishError) return 'finish_error'
  return stage
}

/**
 * Client-side orchestrator for the pronunciation diagnostic (plan 067, step
 * 7): preflight -> prompt-taking -> scoring/persistence -> results.
 */
export function PronunciationAssessmentClient({ userId }: PronunciationAssessmentClientProps) {
  const [stage, setStage] = useState<Stage>('preflight')
  const [result, setResult] = useState<PronunciationDiagnosticResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [finishError, setFinishError] = useState(false)
  const [pendingResults, setPendingResults] = useState<TargetResult[] | null>(null)
  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null)

  // A per-session seed so each diagnostic run varies its selection and items,
  // while staying stable within a single run (so useMemo doesn't re-sample on
  // every render). userId keeps it reproducible-per-user within the session.
  const sessionSeedRef = useRef<string>(`${userId ?? 'guest'}:${Date.now()}:${Math.random()}`)
  const sessionSeed = sessionSeedRef.current

  const selections = useMemo(
    () => selectDiagnosticPrompts({ seed: sessionSeed, cefrLevel: DEFAULT_CEFR }),
    [sessionSeed]
  )

  const wordStressItems = useMemo(() => sampleWordStressItems(sessionSeed), [sessionSeed])

  const buildAndSave = useCallback(
    async (targetResults: TargetResult[], capabilitySnapshot: CapabilitySnapshot) => {
      const prioritized = applyPriorityStatus(targetResults)
      derivePriorityTargetIds(targetResults)
      const sessions = generatePrescriptionSessions(prioritized)

      const candidate = {
        userId: userId ?? 'guest',
        completedAt: new Date().toISOString(),
        capabilitySnapshot,
        selfReport: { overallConfidence: 'somewhat_confident' as const },
        targetResults: prioritized,
        prescription: { generatedAt: new Date().toISOString(), sessions },
      }

      const validated = validateDiagnosticResult(candidate)
      if (!validated.ok) {
        setPendingResults(targetResults)
        setFinishError(true)
        return
      }

      setFinishError(false)
      setPendingResults(null)
      setResult(validated.result)
      setStage('results')
      setSaving(true)
      setSaveError(false)
      try {
        if (userId) {
          const saved = await persistPronunciationAssessmentLocal(userId, validated.result)
          if (!saved.ok) throw new Error('persist failed')
        } else {
          saveGuestPronunciationDiagnostic(validated.result)
        }
      } catch {
        setSaveError(true)
      } finally {
        setSaving(false)
      }
    },
    [userId]
  )

  const handlePromptsComplete = useCallback(
    (targetResults: TargetResult[]) => {
      if (!snapshot) return
      void buildAndSave(targetResults, snapshot)
    },
    [snapshot, buildAndSave]
  )

  const handleRetryFinish = useCallback(() => {
    if (!snapshot || !pendingResults) return
    setFinishError(false)
    void buildAndSave(pendingResults, snapshot)
  }, [snapshot, pendingResults, buildAndSave])

  const handleRetrySave = useCallback(() => {
    if (!result) return
    setSaving(true)
    setSaveError(false)
    ;(async () => {
      try {
        if (userId) {
          const saved = await persistPronunciationAssessmentLocal(userId, result)
          if (!saved.ok) throw new Error('persist failed')
        } else {
          saveGuestPronunciationDiagnostic(result)
        }
      } catch {
        setSaveError(true)
      } finally {
        setSaving(false)
      }
    })()
  }, [result, userId])

  const handleRestart = useCallback(() => {
    setStage('preflight')
    setResult(null)
    setSaving(false)
    setSaveError(false)
    setFinishError(false)
    setPendingResults(null)
    setSnapshot(null)
  }, [])

  let body: ReactNode = null

  if (stage === 'preflight') {
    body = (
      <CapabilityPreflight
        onContinue={(snap) => {
          setSnapshot(snap)
          setStage('prompts')
        }}
      />
    )
  } else if (finishError) {
    body = (
      <div
        role="alert"
        className="flex min-w-0 flex-col gap-3 rounded-md border border-error bg-error-soft p-4"
      >
        <p className="text-pretty font-label text-error">
          No pudimos cerrar el diagnóstico con estas respuestas.
        </p>
        <p className="text-pretty font-body-sm text-fg-muted">
          No perdiste el progreso de las preguntas. Reintenta para ver tu plan, o vuelve más tarde.
        </p>
        <Button
          type="button"
          className="min-h-11 sm:w-fit"
          onClick={handleRetryFinish}
          disabled={!pendingResults || !snapshot}
        >
          Reintentar
        </Button>
      </div>
    )
  } else if (stage === 'prompts' && snapshot) {
    body = (
      <PronunciationPromptFlow
        userId={userId ?? 'guest'}
        selections={selections}
        capabilitySnapshot={snapshot}
        onComplete={handlePromptsComplete}
        wordStressItems={wordStressItems}
      />
    )
  } else if (result) {
    body = (
      <PronunciationResults
        result={result}
        saving={saving}
        saveError={saveError}
        onRetrySave={handleRetrySave}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 pb-[max(0px,env(safe-area-inset-bottom))]">
      <PronunciationAssessmentChrome stage={chromeStage(stage, finishError)} />
      {body}
    </div>
  )
}
