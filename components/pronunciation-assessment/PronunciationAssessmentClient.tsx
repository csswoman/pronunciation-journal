'use client'

import { useCallback, useMemo, useState } from 'react'
import { CapabilityPreflight } from './CapabilityPreflight'
import { PronunciationPromptFlow } from './PronunciationPromptFlow'
import { PronunciationResults } from './PronunciationResults'
import { applyPriorityStatus, derivePriorityTargetIds } from '@/lib/pronunciation/assessment/prioritization'
import { generatePrescriptionSessions } from '@/lib/pronunciation/assessment/prescription'
import { selectDiagnosticPrompts } from '@/lib/pronunciation/assessment/prompt-selection'
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

/**
 * Client-side orchestrator for the pronunciation diagnostic (plan 067, step
 * 7): preflight -> prompt-taking -> scoring/persistence -> results.
 * Mirrors `AssessmentClient.tsx`'s plain-useState state machine.
 */
export function PronunciationAssessmentClient({ userId }: PronunciationAssessmentClientProps) {
  const [stage, setStage] = useState<Stage>('preflight')
  const [result, setResult] = useState<PronunciationDiagnosticResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const selections = useMemo(
    () => selectDiagnosticPrompts({ seed: userId ?? 'guest', cefrLevel: DEFAULT_CEFR }),
    [userId]
  )

  const handleContinue = useCallback(() => {
    setStage('prompts')
  }, [])

  const buildAndSave = useCallback(
    async (targetResults: TargetResult[], snapshot: CapabilitySnapshot) => {
      const prioritized = applyPriorityStatus(targetResults)
      derivePriorityTargetIds(targetResults) // ensures cap logic ran; result already applied above
      const sessions = generatePrescriptionSessions(prioritized)

      const candidate = {
        userId: userId ?? 'guest',
        completedAt: new Date().toISOString(),
        capabilitySnapshot: snapshot,
        selfReport: { overallConfidence: 'somewhat_confident' as const },
        targetResults: prioritized,
        prescription: { generatedAt: new Date().toISOString(), sessions },
      }

      const validated = validateDiagnosticResult(candidate)
      if (!validated.ok) return

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

  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null)

  const handlePromptsComplete = useCallback(
    (targetResults: TargetResult[]) => {
      if (!snapshot) return
      void buildAndSave(targetResults, snapshot)
    },
    [snapshot, buildAndSave]
  )

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

  if (stage === 'preflight') {
    return (
      <CapabilityPreflight
        onContinue={(snap) => {
          setSnapshot(snap)
          handleContinue()
        }}
      />
    )
  }

  if (stage === 'prompts') {
    return (
      <PronunciationPromptFlow userId={userId ?? 'guest'} selections={selections} onComplete={handlePromptsComplete} />
    )
  }

  if (result) {
    return (
      <PronunciationResults result={result} saving={saving} saveError={saveError} onRetrySave={handleRetrySave} />
    )
  }

  return null
}
