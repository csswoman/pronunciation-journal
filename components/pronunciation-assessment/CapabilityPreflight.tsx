'use client'

// Planned structure:
// <CapabilityPreflight>
//   <PreflightPrivacyNotice />
//   <PreflightDegradedNotice />
//   <PreflightContinueButton />
// </CapabilityPreflight>

import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import { buildCapabilitySnapshot, canEvaluateProduction } from '@/lib/pronunciation/assessment/capability'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'
import { PreflightDegradedNotice } from './PreflightDegradedNotice'
import { PreflightPrivacyNotice } from './PreflightPrivacyNotice'

interface CapabilityPreflightProps {
  onContinue: (snapshot: CapabilitySnapshot) => void
}

/**
 * Pre-recording checkpoint: privacy, capability detection, always a way forward.
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
    <div className="flex min-w-0 flex-col gap-5">
      <PreflightPrivacyNotice />

      {!isChecking && !canEvaluate && <PreflightDegradedNotice snapshot={snapshot} />}

      <Button
        onClick={handleContinue}
        disabled={isChecking}
        isLoading={isChecking}
        fullWidth
        className="min-h-11"
      >
        Empezar las preguntas
      </Button>
    </div>
  )
}
