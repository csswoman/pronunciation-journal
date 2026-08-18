'use client'

import type { ReactNode } from 'react'
import { EssentialWordsStudyChrome } from './EssentialWordsStudyChrome'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'

// Planned structure:
// <EssentialWordsImmersivePhase>
//   <EssentialWordsStudyChrome />
//   <card slot />
// </EssentialWordsImmersivePhase>

interface EssentialWordsImmersivePhaseProps {
  sessionCurrent: number
  sessionTotal: number
  onExit: () => void
  children: ReactNode
}

export function EssentialWordsImmersivePhase({
  sessionCurrent,
  sessionTotal,
  onExit,
  children,
}: EssentialWordsImmersivePhaseProps) {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-1 flex-col gap-layout-stack">
      <EssentialWordsStudyChrome
        current={sessionCurrent}
        total={sessionTotal}
        onExit={onExit}
      />
      <div className="flex flex-1 flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}

export interface PendingAttempt {
  stepId: string
  outcome: AttemptOutcome
}
