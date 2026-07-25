'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
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

export function DailyReaderStep({ passage, threadHints, onComplete }: DailyReaderStepProps) {
  const { user } = useAuth()
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  return (
    <div className="mx-auto flex max-w-prose flex-col gap-4 p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
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
