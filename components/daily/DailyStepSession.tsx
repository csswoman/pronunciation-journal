'use client'

// Planned structure:
// <DailyStepSession>
//   <WordIntroStep />       — si word_intro: presentación de palabras nuevas
//   <FalseFriendsIntroStep /> — si false_friends: presenta los pares antes de practicar
//   <DailyReaderStep />     — si reader: lectura con comprehensible input
//   <DailyThreadStrip />    — hilo solo fuera de la práctica activa
//   <PhonemeLessonIntro />  — si phoneme_focus + ipa conocido + no iniciado
//   <PracticeSession />     — ejercicios del paso (sesión sagrada: sin hints ni chrome extra)
// </DailyStepSession>

import { useState } from 'react'
import PracticeSession from '@/components/practice/PracticeSession'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import { WordIntroStep } from '@/components/daily/WordIntroStep'
import { FalseFriendsIntroStep } from '@/components/daily/FalseFriendsIntroStep'
import { DailyReaderStep } from '@/components/daily/DailyReaderStep'
import { DailyThreadStrip } from '@/components/daily/DailyThreadStrip'
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
  useHideMobileNavDuringSession()
  const threadHints = getThreadHintsForStep(allSteps, stepIndex)

  const showable =
    step.kind === 'phoneme_focus' &&
    !!step.ipa &&
    !!IPA_EXTRA[step.ipa]

  const showFalseFriendsIntro =
    step.kind === 'false_friends' && (step.falseFriends?.length ?? 0) > 0

  const [started, setStarted] = useState(!showable && !showFalseFriendsIntro)

  if (step.kind === 'word_intro') {
    return (
      <div className="mx-auto flex w-full flex-col gap-4 layout-card-pad pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
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

  // Noticing before testing: present the pairs, then fall through to the
  // exercises in the same step (unlike word_intro, which is a step of its own).
  if (!started && showFalseFriendsIntro) {
    return (
      <div className="mx-auto flex max-w-prose flex-col gap-4 layout-card-pad pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <FalseFriendsIntroStep
          pairs={step.falseFriends ?? []}
          onComplete={() => setStarted(true)}
        />
      </div>
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

  // No outer .phoneme-focus and no thread chips here: PracticeSession owns the
  // focus shell. Sibling hints were flex-laid beside the phone and covered the task.
  return (
    <PracticeSession
      key={sessionKey}
      context="daily"
      exercises={step.exercises}
      sessionLength={step.exercises.length}
      sessionLabel={step.title}
      soundIpa={step.ipa}
      initialIndex={initialExerciseIndex ?? 0}
      onSessionComplete={() => undefined}
      onExit={(result) => {
        if (result.results.length >= step.exercises.length) onComplete()
        else onExit()
      }}
    />
  )
}
