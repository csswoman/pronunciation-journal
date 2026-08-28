'use client'

// Planned structure:
// <PracticeOptionsGrid>
//   hero bento: <SoundQuizWidget /> + <VocabularyReviewCard /> + <CoachCallCard />
//   <PronunciationSection />   Sonidos / puerta 1
//   <VocabularySection />     Palabras / puerta 2
//   <ContextReadingSection /> Leer y escuchar / puerta 3
//   <GamesSection />          Jugar / puerta 4
//   <ReferenceSection />      Diccionario, fuera de las 4 puertas por diseño
// </PracticeOptionsGrid>

import type { SessionArc } from '@/lib/practice/types'
import SoundQuizWidget from './SoundQuizWidget'
import VocabularyReviewCard from './VocabularyReviewCard'
import CoachCallCard from './CoachCallCard'
import PronunciationSection from './PronunciationSection'
import VocabularySection from './VocabularySection'
import ContextReadingSection from './ContextReadingSection'
import GamesSection from './GamesSection'
import ReferenceSection from './ReferenceSection'

interface PracticeOptionsGridProps {
  dueCount: number | null
  arc?: SessionArc
}

export default function PracticeOptionsGrid({ dueCount, arc }: PracticeOptionsGridProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* ─── HERO: lo más urgente/interactivo primero ────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-6 lg:self-start">
          <SoundQuizWidget />
        </div>
        <div className="flex flex-col gap-5 lg:col-span-6">
          <VocabularyReviewCard dueCount={dueCount} />
          <CoachCallCard arc={arc} />
        </div>
      </div>

      {/* ─── CUATRO PUERTAS: el resto de la práctica libre, por categoría ────── */}
      <PronunciationSection />
      <VocabularySection dueCount={dueCount} />
      <ContextReadingSection />
      <GamesSection />
      <ReferenceSection />
    </div>
  )
}
