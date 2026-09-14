'use client'

// Planned structure:
// <DailyStepSession>
//   <WordIntroStep />       — si word_intro: presentación de palabras nuevas
//   <FalseFriendsIntroStep /> — si false_friends: presenta los pares antes de practicar
//   <DailyReaderStep />     — si reader: lectura con comprehensible input
//   <DailyThreadStrip />    — hilo solo fuera de la práctica activa
//   <PhonemeLessonIntro />  — si phoneme_focus + ipa conocido + no iniciado
//   <GrammarRuleCard />     — si grammar_focus + grammarRule: regla antes de practicar
//   <PracticeSession />     — ejercicios del paso (sesión sagrada: sin hints ni chrome extra)
// </DailyStepSession>

import { useCallback, useEffect, useState } from 'react'
import PracticeSession from '@/components/practice/PracticeSession'
import { useHideMobileNavDuringSession } from '@/hooks/useHideMobileNavDuringSession'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import { WordIntroStep } from '@/components/daily/WordIntroStep'
import { FalseFriendsIntroStep } from '@/components/daily/FalseFriendsIntroStep'
import { GrammarRuleCard } from '@/components/daily/GrammarRuleCard'
import { DailyReaderStep } from '@/components/daily/DailyReaderStep'
import { DailyThreadStrip } from '@/components/daily/DailyThreadStrip'
import { EdDrillSession } from '@/components/pronunciation/ed-drills/EdDrillSession'
import { ChunkStudyPanel } from '@/components/practice/chunks/ChunkStudyPanel'
import { getThreadHintsForStep } from '@/lib/practice/daily-plan/step-thread'
import { IPA_EXTRA } from '@/lib/pronunciation/ipa-data'
import { useAuth } from '@/components/auth/AuthProvider'
import { logDailyStepEvent } from '@/lib/practice/daily-plan/analytics'
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

function ActiveSessionChrome() {
  useHideMobileNavDuringSession()
  return null
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
  const { user } = useAuth()
  const isReader = step.kind === 'reader'
  const threadHints = getThreadHintsForStep(allSteps, stepIndex)

  const showable =
    step.kind === 'phoneme_focus' &&
    !!step.ipa &&
    !!IPA_EXTRA[step.ipa]

  const showFalseFriendsIntro =
    step.kind === 'false_friends' && (step.falseFriends?.length ?? 0) > 0

  const showGrammarIntro =
    step.kind === 'grammar_focus' && !!step.grammarRule

  const showChunkIntro = step.kind === 'chunk_intro' && (step.chunks?.length ?? 0) > 0
  const [started, setStarted] = useState(!showable && !showFalseFriendsIntro && !showGrammarIntro && !showChunkIntro)

  useEffect(() => {
    void logDailyStepEvent('daily_step_started', step, user?.id).catch(() => undefined)
  }, [step, user?.id])

  const handleStepComplete = useCallback(() => {
    void logDailyStepEvent('daily_step_completed', step, user?.id, step.exercises.length).catch(() => undefined)
    onComplete()
  }, [onComplete, step, user?.id])

  const handleStepExit = useCallback((completedExercises = 0) => {
    void logDailyStepEvent('daily_step_exited', step, user?.id, completedExercises).catch(() => undefined)
    onExit()
  }, [onExit, step, user?.id])

  const sessionChrome = !isReader ? <ActiveSessionChrome /> : null

  if (step.kind === 'word_intro') {
    return (
      <div className="mx-auto flex w-full flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {sessionChrome}
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <WordIntroStep cards={step.studyCards ?? []} onComplete={handleStepComplete} />
      </div>
    )
  }

  if (!started && showChunkIntro && step.chunks) {
    return (
      <div className="mx-auto flex w-full max-w-prose flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {sessionChrome}
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <ChunkStudyPanel chunks={step.chunks} onStart={() => setStarted(true)} />
      </div>
    )
  }

  // Sesión autocontenida (sin `exercises`): debe salir antes del fallthrough a
  // PracticeSession, que con una lista vacía se autocompletaría al instante.
  if (step.kind === 'ed_cluster_drill') {
    return (
      <div className="mx-auto flex w-full max-w-prose flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {sessionChrome}
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <EdDrillSession onComplete={handleStepComplete} />
      </div>
    )
  }

  if (step.kind === 'reader' && step.readerPassage) {
    return (
      <DailyReaderStep
        passage={step.readerPassage}
        threadHints={threadHints}
        onComplete={handleStepComplete}
        onExit={() => handleStepExit()}
      />
    )
  }

  // Noticing before testing: present the pairs, then fall through to the
  // exercises in the same step (unlike word_intro, which is a step of its own).
  if (!started && showFalseFriendsIntro) {
    return (
      <div className="mx-auto flex max-w-prose flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <FalseFriendsIntroStep
          pairs={step.falseFriends ?? []}
          onComplete={() => setStarted(true)}
        />
      </div>
    )
  }

  // Rule before drill: show the grammar rule once, then fall through to the
  // exercises in the same step.
  if (!started && showGrammarIntro && step.grammarRule) {
    return (
      <div className="mx-auto flex max-w-prose flex-col gap-4 p-[var(--layout-card-pad)] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] lg:pb-[var(--layout-section-gap)]">
        {threadHints.length > 0 ? <DailyThreadStrip hints={threadHints} /> : null}
        <GrammarRuleCard
          rule={step.grammarRule}
          onContinue={() => setStarted(true)}
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
        if (result.results.length >= step.exercises.length) handleStepComplete()
        else handleStepExit(result.results.length)
      }}
    />
  )
}
