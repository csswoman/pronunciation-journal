'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { ReaderExercise } from '@/components/practice/reader/ReaderExercise'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import { DailyThreadStrip } from './DailyThreadStrip'

interface DailyReaderStepProps {
  passage: ReaderPassage
  threadHints: StepThreadHint[]
  onComplete: () => void
}

// Planned structure:
// <DailyReaderStep>
//   DailyThreadStrip (context hints)
//   ReaderExercise (passage practice)
// </DailyReaderStep>

export function DailyReaderStep({ passage, threadHints, onComplete }: DailyReaderStepProps) {
  useHideMobileNavDuringSession()
  const { user } = useAuth()
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
      {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
      <ReaderExercise
        passage={passage}
        online={online}
        onComplete={async (correct) => {
          if (!user) return
          await completeReader({
            userId: user.id,
            passageId: passage.id,
            correct,
            context: 'daily',
          })
          onComplete()
        }}
      />
    </div>
  )
}
