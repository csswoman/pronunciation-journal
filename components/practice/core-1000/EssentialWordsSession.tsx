'use client'

// Planned structure:
// <EssentialWordsSession>
//   <DeckProgressHeader />
//   <SessionProgressHud />   — New · Learning · Review live counters
//   <WordStudyCard />        — phase: study (new cards)
//   <SpeakReviewCard />      — phase: speak
//   <SessionDone />          — phase: done / empty
// </EssentialWordsSession>

import { useEssentialWordsSession } from '@/hooks/useEssentialWordsSession'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import { DeckProgressHeader } from './DeckProgressHeader'
import { SessionProgressHud } from './SessionProgressHud'
import { WordStudyCard } from './WordStudyCard'
import { SpeakReviewCard } from './SpeakReviewCard'
import { SessionDone } from './SessionDone'
import { WordCarousel } from '@/components/practice/session/WordCarousel'

export function EssentialWordsSession() {
  const {
    phase, current, stats, counts, sessionSummary,
    reloadLoading, startSpeak, submitGrade, reload, learnMore, archiveWord,
  } = useEssentialWordsSession()
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
        onLearnMore={phase === 'done' ? learnMore : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <DeckProgressHeader stats={stats} />
      <SessionProgressHud counts={counts} />
      {phase === 'study' && current && (
        <WordStudyCard
          entry={current.entry}
          onContinue={startSpeak}
          onArchive={() => void archiveWord(current.entry.word)}
        />
      )}
      {phase === 'speak' && current && (
        <SpeakReviewCard
          entry={current.entry}
          onGraded={submitGrade}
          onArchive={() => void archiveWord(current.entry.word)}
        />
      )}
    </div>
  )
}
