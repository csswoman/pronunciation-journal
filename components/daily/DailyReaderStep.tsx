'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ReaderExercise } from '@/components/practice/reader/ReaderExercise'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import { StepThreadHints } from './StepThreadHints'

interface DailyReaderStepProps {
  passage: ReaderPassage
  threadHints: StepThreadHint[]
  onComplete: () => void
}

export function DailyReaderStep({ passage, threadHints, onComplete }: DailyReaderStepProps) {
  const { user } = useAuth()
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  return (
    <div className="mx-auto max-w-prose p-6">
      {threadHints.length > 0 && (
        <StepThreadHints
          hints={threadHints}
          className="mb-4 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3"
        />
      )}
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
