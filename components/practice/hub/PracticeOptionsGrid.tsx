'use client'

// Planned structure:
// <PracticeOptionsGrid> — 4-row Bento Grid layout matching the reference mockup
//   Row 1 (Hero Bento: 5 / 7 cols): RecommendedPracticeCard + SoundQuizWidget
//   Row 2 (Vocabulary & Coach: 3 equal cols): VocabularyReviewCard + CoachCallCard + DecksCard
//   Row 3 (Context & Course: 3 equal cols): ImmersionCard + ReaderCard + CourseCard
//   Row 4 (Games & Reference: 8 / 4 cols): GamesSection + ReferenceSection

import type { SessionArc } from '@/lib/practice/types'
import type { RecommendedResult } from '@/lib/practice/practice-modes'
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
  recommendation: RecommendedResult
  dueCount: number | null
  vocabLearnedCount: number | null
  vocabTotalCount: number | null
  arc?: SessionArc
}

export default function PracticeOptionsGrid({
  recommendation,
  dueCount,
  vocabLearnedCount,
  vocabTotalCount,
  arc,
}: PracticeOptionsGridProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* ─── FILA 1: Top Hero Bento (2 columnas: 5 / 7 cols desde md:) ─── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-5">
          <RecommendedPracticeCard recommendation={recommendation} />
        </div>
        <div className="md:col-span-7">
          <SoundQuizWidget />
        </div>
      </div>

      {/* ─── FILA 2: Vocabulario, Coach y Mazos (3 cols en tablet y desktop) ─── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <VocabularyReviewCard
          dueCount={dueCount}
          learnedCount={vocabLearnedCount}
          totalCount={vocabTotalCount}
        />
        <CoachCallCard arc={arc} />
        <DecksCard />
      </div>

      {/* ─── FILA 3: Inmersión, Lectura en Contexto y Ruta Guiada (3 cols en tablet y desktop) ─── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <ImmersionCard />
        <ReaderCard />
        <CourseCard />
      </div>

      {/* ─── FILA 4: Juegos de Vocabulario y Diccionario (2 columnas: 8 / 4 cols desde md:) ─── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-8">
          <GamesSection />
        </div>
        <div className="md:col-span-4">
          <ReferenceSection />
        </div>
      </div>
    </div>
  )
}


