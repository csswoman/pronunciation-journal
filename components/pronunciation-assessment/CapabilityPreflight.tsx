'use client'

// Planned structure:
// <CapabilityPreflight>
//   <PreflightPrivacyNotice />
//   <PreflightDegradedNotice />   (only when production can't be evaluated)
//   <PreflightContinueButton />
// </CapabilityPreflight>

import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import { buildCapabilitySnapshot, canEvaluateProduction } from '@/lib/pronunciation/assessment/capability'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'
import { PreflightDegradedNotice } from './PreflightDegradedNotice'
import { PreflightPrivacyNotice } from './PreflightPrivacyNotice'

interface CapabilityPreflightProps {
  /** Called with the captured snapshot when the learner chooses to continue. */
  onContinue: (snapshot: CapabilitySnapshot) => void
}

/**
 * Pre-recording checkpoint for the pronunciation diagnostic (plan 067,
 * step 2). Explains what is sent/retained before any mic access, detects
 * mic permission / STT / browser support, and always leaves the learner a
 * way forward — production evaluation degrades to perception/self-report
 * rather than dead-ending the flow.
 */
export function CapabilityPreflight({ onContinue }: CapabilityPreflightProps) {
  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null)

  useEffect(() => {
    let cancelled = false
    buildCapabilitySnapshot().then((result) => {
      if (!cancelled) setSnapshot(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const isChecking = snapshot === null
  const canEvaluate = snapshot !== null && canEvaluateProduction(snapshot)

  const handleContinue = () => {
    if (snapshot) onContinue(snapshot)
  }

  return (
    <div className="flex flex-col gap-4 rounded-md border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
      <PreflightPrivacyNotice />

      {!isChecking && !canEvaluate && <PreflightDegradedNotice snapshot={snapshot} />}

      <Button onClick={handleContinue} disabled={isChecking} isLoading={isChecking}>
        Continuar
      </Button>
    </div>
  )
}
