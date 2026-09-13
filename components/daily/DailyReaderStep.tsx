'use client'

// Planned structure:
// <DailyReaderStep>
//   <ReaderNavHeader>
//     <BackLink / ExitButton />
//     <PageHeader />
//   </ReaderNavHeader>
//   <DailyThreadStrip /> (context hints)
//   <ReaderExercise showHeader={false} /> (passage practice)
// </DailyReaderStep>

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ArrowLeft } from '@/components/icons'
import PageHeader from '@/components/layout/PageHeader'
import Badge from '@/components/ui/Badge'
import { ReaderExercise } from '@/components/practice/reader/ReaderExercise'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import type { StepThreadHint } from '@/lib/practice/daily-plan/step-thread'
import { DailyThreadStrip } from './DailyThreadStrip'

interface DailyReaderStepProps {
  passage: ReaderPassage
  threadHints: StepThreadHint[]
  onComplete: () => void
  onExit?: () => void
}

export function DailyReaderStep({
  passage,
  threadHints,
  onComplete,
  onExit,
}: DailyReaderStepProps) {
  const { user } = useAuth()
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  const title = passage.topic ? `Lectura: ${passage.topic}` : 'Lectura del día'
  const subtitle = `Historia adaptada a tu nivel (${passage.level.toUpperCase()}) para reciclar vocabulario reciente.`

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:gap-5 p-[var(--layout-card-pad)] pb-[max(5.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
      <div className="flex w-full flex-col gap-1.5">
        {onExit ? (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onExit}
              className="focus-ring inline-flex items-center gap-1.5 rounded py-0.5 px-1 -ml-1 text-caption font-medium text-fg-muted transition-colors hover:text-fg cursor-pointer press-feedback"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              <span>Volver al plan</span>
            </button>
          </div>
        ) : null}

        <PageHeader
          variant="compact"
          kicker="Plan de hoy · Lectura"
          title={title}
          subtitle={subtitle}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge label={`Nivel ${passage.level.toUpperCase()}`} variant="neutral" size="sm" />
              {passage.targetItems.length > 0 && (
                <Badge
                  label={`${passage.targetItems.length} ${passage.targetItems.length === 1 ? 'palabra clave' : 'palabras clave'}`}
                  variant="default"
                  size="sm"
                />
              )}
              <span className="text-caption text-fg-muted font-mono hidden sm:inline">
                ~1 min de lectura
              </span>
            </div>
          }
        />
      </div>

      {threadHints.length > 0 ? (
        <div className="w-full">
          <DailyThreadStrip hints={threadHints} />
        </div>
      ) : null}

      <ReaderExercise
        passage={passage}
        online={online}
        showHeader={false}
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
