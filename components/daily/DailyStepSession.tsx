'use client'

// Planned structure:
// <DailyStepSession>
//   <WordIntroStep />       — si word_intro: presentación de palabras nuevas
//   <DailyReaderStep />     — si reader: lectura con comprehensible input
//   <StepThreadHints />     — palabras que reaparecen de pasos anteriores
//   <PhonemeLessonIntro />  — si phoneme_focus + ipa conocido + no iniciado
//   <PracticeSession />     — ejercicios del paso
// </DailyStepSession>

import { useState } from 'react'
import PracticeSession from '@/components/practice/PracticeSession'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import { WordIntroStep } from '@/components/daily/WordIntroStep'
import { DailyReaderStep } from '@/components/daily/DailyReaderStep'
import { StepThreadHints } from '@/components/daily/StepThreadHints'
import { getThreadHintsForStep } from '@/lib/practice/daily-plan/step-thread'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import type { DailyStep } from '@/lib/practice/types'

interface Props {
  step: DailyStep
  allSteps: DailyStep[]
  stepIndex: number
  sessionKey: number
  initialExerciseIndex?: number
  onComplete: () => void
  onExit: () => void
}

export default function DailyStepSession({
  step,
  allSteps,
  stepIndex,
  sessionKey,
  initialExerciseIndex,
  onComplete,
  onExit,
}: Props) {
  const threadHints = getThreadHintsForStep(allSteps, stepIndex)

  const showable =
    step.kind === 'phoneme_focus' &&
    !!step.ipa &&
    !!IPA_EXTRA[step.ipa]

  const [started, setStarted] = useState(!showable)

  if (step.kind === 'word_intro') {
    return (
      <div className="mx-auto max-w-prose p-6">
        {threadHints.length > 0 && (
          <StepThreadHints
            hints={threadHints}
            className="mb-4 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3"
          />
        )}
        <WordIntroStep cards={step.studyCards ?? []} onComplete={onComplete} />
      </div>
    )
  }

  if (step.kind === 'reader' && step.readerPassage) {
    return (
      <DailyReaderStep
        passage={step.readerPassage}
        threadHints={threadHints}
        onComplete={onComplete}
      />
    )
  }

  if (!started && step.ipa) {
    return (
      <div className="phoneme-focus">
        <div className="phoneme-focus__wrap">
          <div className="phoneme-focus__phone">
            <div className="phoneme-focus__stage phoneme-focus__stage--flush overflow-y-auto">
              <PhonemeLessonIntro
                ipa={step.ipa}
                onStart={() => setStarted(true)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="phoneme-focus">
      {threadHints.length > 0 && (
        <div className="mx-auto max-w-prose px-6 pt-4">
          <StepThreadHints
            hints={threadHints}
            className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-3"
          />
        </div>
      )}
      <PracticeSession
        key={sessionKey}
        context="daily"
        exercises={step.exercises}
        sessionLength={step.exercises.length}
        sessionLabel={step.title}
        initialIndex={initialExerciseIndex ?? 0}
        onSessionComplete={() => undefined}
        onExit={(result) => {
          if (result.results.length >= step.exercises.length) onComplete()
          else onExit()
        }}
      />
    </div>
  )
}
