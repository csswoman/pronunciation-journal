'use client'

// Planned structure:
// <DailyStepSession>
//   <WordIntroStep />       — si word_intro: presentación de palabras nuevas
//   <PhonemeLessonIntro />  — si phoneme_focus + ipa conocido + no iniciado
//   <PracticeSession />     — ejercicios del paso
// </DailyStepSession>

import { useState } from 'react'
import PracticeSession from '@/components/practice/PracticeSession'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import { WordIntroStep } from '@/components/daily/WordIntroStep'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import type { DailyStep } from '@/lib/practice/types'

interface Props {
  step: DailyStep
  sessionKey: number
  initialExerciseIndex?: number
  onComplete: () => void
  onExit: () => void
}

export default function DailyStepSession({
  step,
  sessionKey,
  initialExerciseIndex,
  onComplete,
  onExit,
}: Props) {
  const showable =
    step.kind === 'phoneme_focus' &&
    !!step.ipa &&
    !!IPA_EXTRA[step.ipa]

  const [started, setStarted] = useState(!showable)

  // word_intro is a non-evaluated presentation step: show the study cards, then
  // mark the step complete (it carries no exercises / answer_history).
  if (step.kind === 'word_intro') {
    return <WordIntroStep cards={step.studyCards ?? []} onComplete={onComplete} />
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
  )
}
