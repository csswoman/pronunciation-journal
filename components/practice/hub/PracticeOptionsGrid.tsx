'use client'

// Planned structure:
// <PracticeOptionsGrid> — CSS Grid masonry (fine columns + JS row spans)
//   Container: flex column on mobile; display:grid repeat(2|4,1fr) + grid-auto-rows:8px from tablet
//   Each card wrapper carries data-span (1 | 2 | 4) → CSS maps to grid-column: span N
//   useMasonryLayout(gridRef) measures each child and sets gridRowEnd so rows collapse to content

import { useRef } from 'react'
import type { SessionArc } from '@/lib/practice/types'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import type { PracticeHubData } from '@/lib/practice/hub-data-types'
import { useMasonryLayout } from '@/hooks/useMasonryLayout'
import RecommendedPracticeCard from './RecommendedPracticeCard'
import SoundQuizWidget from './SoundQuizWidget'
import VocabularyReviewCard from './VocabularyReviewCard'
import CoachCallCard from './CoachCallCard'
import DecksCard from './DecksCard'
import ImmersionCard from './ImmersionCard'
import ReaderCard from './ReaderCard'
import CourseCard from './CourseCard'
import GamesSection from './GamesSection'
import ReferenceSection from './ReferenceSection'

// span = columns occupied on DESKTOP (4-col grid). Tablet CSS caps this at 2.
const PRACTICE_CARD_SPANS = {
  recommended: 4,
  vocabulary: 1,
  decks: 1,
  soundQuiz: 2,
  coach: 2,
  games: 2,
  immersion: 1,
  reader: 1,
  course: 1,
  reference: 1,
} as const

interface PracticeOptionsGridProps {
  recommendation: RecommendedResult
  dueCount: number | null
  vocabLearnedCount: number | null
  vocabTotalCount: number | null
  arc?: SessionArc
  hubData: PracticeHubData
  /** Dexie-backed count of immersion lessons the user has watched. */
  immersionWatchedCount: number | null
}

export default function PracticeOptionsGrid({
  recommendation,
  dueCount,
  vocabLearnedCount,
  vocabTotalCount,
  arc,
  hubData,
  immersionWatchedCount,
}: PracticeOptionsGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  useMasonryLayout(gridRef)

  return (
    <div className="practice-hub__masonry" ref={gridRef}>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.recommended}>
        <RecommendedPracticeCard recommendation={recommendation} data={hubData.recommended} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.vocabulary}>
        <VocabularyReviewCard
          dueCount={dueCount}
          learnedCount={vocabLearnedCount}
          totalCount={vocabTotalCount}
        />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.decks}>
        <DecksCard data={hubData.decks} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.soundQuiz}>
        <SoundQuizWidget />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.coach}>
        <CoachCallCard arc={arc} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.games}>
        <GamesSection />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.immersion}>
        <ImmersionCard
          watchedCount={immersionWatchedCount}
          totalCount={hubData.immersion.totalCount}
        />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.reader}>
        <ReaderCard recentWordCount={hubData.reader.recentWordCount} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.course}>
        <CourseCard data={hubData.course} />
      </div>
      <div className="practice-hub__masonry-item" data-span={PRACTICE_CARD_SPANS.reference}>
        <ReferenceSection />
      </div>
    </div>
  )
}
