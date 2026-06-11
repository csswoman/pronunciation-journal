'use client'

// Planned structure:
// <Core1000Session>
//   <DeckProgressHeader />
//   <WordStudyCard />    — fase study (tarjetas nuevas)
//   <SpeakReviewCard />  — fase speak
//   <SessionDone />      — fases done / empty
// </Core1000Session>

import { useCore1000Session } from '@/hooks/useCore1000Session'
import { DeckProgressHeader } from './DeckProgressHeader'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'

export function Core1000Session() {
  const { phase, current, position, queueLength, stats, startSpeak, submitGrade } =
    useCore1000Session()

  if (phase === 'loading') {
    return (
      <p className="text-sm text-[var(--text-tertiary)] text-center py-10">Cargando deck…</p>
    )
  }

  if (phase === 'empty' || phase === 'done') {
    return <SessionDone stats={stats} wasEmpty={phase === 'empty'} />
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
