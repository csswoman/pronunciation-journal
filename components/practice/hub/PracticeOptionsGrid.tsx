'use client'

// Planned structure:
// <PracticeOptionsGrid> — 3-column responsive layout with category filtering
//   Header Hero Banner: RecommendedPracticeCard (spans top)
//   Grid Container: 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
//   Card Filtering: filter cards based on activeFilter ('all' | 'vocab' | 'sound' | 'speech')
// </PracticeOptionsGrid>

import type { SessionArc } from '@/lib/practice/types'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
import type { PracticeHubData } from '@/lib/practice/hub-data-types'
import type { PracticeFilter } from './PracticeHubHeader'
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

interface PracticeOptionsGridProps {
  activeFilter?: PracticeFilter
  recommendation: RecommendedResult
  essentialWordsDueCount: number | null
  vocabLearnedCount: number | null
  vocabTotalCount: number | null
  arc?: SessionArc
  hubData: PracticeHubData
  /** Dexie-backed count of immersion lessons the user has watched. */
  immersionWatchedCount: number | null
}

export default function PracticeOptionsGrid({
  activeFilter = 'all',
  recommendation,
  essentialWordsDueCount,
  vocabLearnedCount,
  vocabTotalCount,
  arc,
  hubData,
  immersionWatchedCount,
}: PracticeOptionsGridProps) {
  const showVocab = activeFilter === 'all' || activeFilter === 'vocab'
  const showSound = activeFilter === 'all' || activeFilter === 'sound'
  const showSpeech = activeFilter === 'all' || activeFilter === 'speech'

  return (
    <div className="flex flex-col gap-5">
      {/* Hero Recommended Banner */}
      <RecommendedPracticeCard recommendation={recommendation} data={hubData.recommended} />

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
        {/* Column 1: Vocabulario & Coach */}
        <div className="flex flex-col gap-5">
          {showVocab && (
            <VocabularyReviewCard
              dueCount={essentialWordsDueCount}
              learnedCount={vocabLearnedCount}
              totalCount={vocabTotalCount}
            />
          )}
          {showSpeech && <CoachCallCard arc={arc} />}
          {showVocab && <GamesSection />}
        </div>

        {/* Column 2: Sonido & Mazos & Inmersión */}
        <div className="flex flex-col gap-5">
          {showSound && <SoundQuizWidget />}
          {showVocab && <DecksCard data={hubData.decks} />}
          {showSound && (
            <ImmersionCard
              watchedCount={immersionWatchedCount}
              totalCount={hubData.immersion.totalCount}
            />
          )}
        </div>

        {/* Column 3: Lectura & Ruta & Diccionario */}
        <div className="flex flex-col gap-5">
          {showVocab && <ReaderCard recentWordCount={hubData.reader.recentWordCount} />}
          {showSpeech && <CourseCard data={hubData.course} />}
          {showVocab && <ReferenceSection />}
        </div>
      </div>
    </div>
  )
}
