'use client'

// Planned structure:
// <Core1000Session>
//   <DeckProgressHeader />
//   <WordStudyCard />    — fase study (tarjetas nuevas)
//   <SpeakReviewCard />  — fase speak
//   <SessionDone />      — fases done / empty
// </Core1000Session>

import { useCore1000Session } from '@/hooks/useCore1000Session'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { DeckProgressHeader } from './DeckProgressHeader'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'
import { WordCarousel } from '@/components/practice/session/WordCarousel'

export function Core1000Session() {
  const {
    phase, current, position, queueLength, stats, sessionSummary,
    reloadLoading, startSpeak, submitGrade, reload,
  } = useCore1000Session()
  const loadingWords = useLoadingWords()

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <WordCarousel words={loadingWords} />
      </div>
    )
  }

  if (phase === 'empty' || phase === 'done') {
    return (
      <SessionDone
        stats={stats}
        sessionSummary={sessionSummary}
        wasEmpty={phase === 'empty'}
        onContinue={reload}
        continueLoading={reloadLoading}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <DeckProgressHeader stats={stats} />
      <p className="text-tiny uppercase tracking-[0.12em] text-[var(--text-tertiary)] m-0">
        {position} / {queueLength}
      </p>
      {phase === 'study' && current && (
        <WordStudyCard entry={current.entry} onContinue={startSpeak} />
      )}
      {phase === 'speak' && current && (
        <SpeakReviewCard entry={current.entry} onGraded={submitGrade} />
      )}
    </div>
  )
}
