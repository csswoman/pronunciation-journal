'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ReaderExercise } from '@/components/practice/reader/ReaderExercise'
import { buildSessionResult } from '@/lib/practice/session-result'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { flushOutbox } from '@/lib/sync/sync-manager'
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
          const result = {
            exerciseId: `reader:${passage.id}`,
            slug: 'multiple_choice' as const,
            exerciseTypeId: 17,
            isCorrect: correct,
            timeMs: 0,
            contentId: passage.id,
            context: 'daily' as const,
            completedAt: new Date(),
          }
          await savePracticeAnswer(user.id, result)
          await recordActivitySession(user.id, {
            practiceContext: 'daily',
            source: 'practice',
            sessionResult: buildSessionResult([result]),
          })
          await flushOutbox()
          onComplete()
        }}
      />
    </div>
  )
}
