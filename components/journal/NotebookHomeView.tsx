'use client'

// Planned structure:
// <NotebookHomeView>
//   <Header: "Tu cuaderno" + totals count />
//   <NotebookTodayCard: main writing card />
//   <JournalPronunciationCard: pronunciation journal card (opens modal) />
//   <JournalPronunciationModal: interactive modal for adding/editing words />
//   {learnings ? <NotebookLearningsCard /> : null}
//   {pastPages.length === 0 ? <FirstUseHint /> : <NotebookPastGrid />}
// </NotebookHomeView>

import { useState, useEffect } from 'react'
import {
  SAMPLE_NOTEBOOK_DATA,
  type NotebookHome,
  type NotebookTopic,
} from '@/lib/journal/notebook-types'
import { NotebookTodayCard } from './NotebookTodayCard'
import { JournalPronunciationCard } from './JournalPronunciationCard'
import { JournalPronunciationModal } from './JournalPronunciationModal'
import { NotebookPastGrid } from './NotebookPastGrid'
import { NotebookLearningsCard } from './NotebookLearningsCard'

// Stable reference: a `= []` default param is a fresh array every render, which
// makes the savedPronunciationWords effect below loop once the parent re-renders.
const EMPTY_WORDS: string[] = []

interface NotebookHomeViewProps {
  initialData?: NotebookHome
  learnings?: {
    recentErrors: Array<{ quote: string; correction: string; type: string; explanationEs: string }>
    recentWords: string[]
  }
  savedPronunciationWords?: string[]
  onSelectMode?: (mode: 'guided' | 'blank' | 'pronunciation') => void
  onSavePronunciationWords?: (words: string[]) => void
}

export function NotebookHomeView({
  initialData = SAMPLE_NOTEBOOK_DATA,
  learnings,
  savedPronunciationWords = EMPTY_WORDS,
  onSelectMode,
  onSavePronunciationWords,
}: NotebookHomeViewProps) {
  const [data, setData] = useState<NotebookHome>(initialData)
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState(false)
  const [pronunciationWords, setPronunciationWords] = useState<string[]>(savedPronunciationWords)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    setPronunciationWords(savedPronunciationWords)
  }, [savedPronunciationWords])

  const isFirstUse = data.pastPages.length === 0

  function handleTopicChange(topic: NotebookTopic) {
    setData((prev) => ({
      ...prev,
      today: {
        ...prev.today,
        topic,
      },
    }))
  }

  function handleSaveModalWords(newWords: string[]) {
    setPronunciationWords(newWords)
    onSavePronunciationWords?.(newWords)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Encabezado ── */}
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-h4 font-medium text-fg">
          Tu cuaderno
        </h1>

        {!isFirstUse && data.totals && (
          <p className="font-caption text-fg-muted">
            {data.totals.pages} {data.totals.pages === 1 ? 'página' : 'páginas'} ·{' '}
            {data.totals.sentences} {data.totals.sentences === 1 ? 'frase' : 'frases'} en inglés ·{' '}
            1 día seguido
          </p>
        )}
      </header>

      {/* ── Tarjeta principal de la página de hoy ── */}
      <NotebookTodayCard
        today={data.today}
        onSelectMode={onSelectMode}
        onTopicChange={handleTopicChange}
      />

      {/* ── Tarjeta del Diario de Pronunciación ── */}
      <JournalPronunciationCard
        savedWords={pronunciationWords}
        onAddWord={() => setIsPronunciationModalOpen(true)}
      />

      {/* ── Modal interactivo de Diario de Pronunciación ── */}
      <JournalPronunciationModal
        isOpen={isPronunciationModalOpen}
        onClose={() => setIsPronunciationModalOpen(false)}
        onSaveWords={handleSaveModalWords}
        existingWords={pronunciationWords}
      />

      {/* ── Notas de aprendizaje de páginas anteriores ── */}
      {learnings && (learnings.recentErrors.length > 0 || learnings.recentWords.length > 0) ? (
        <NotebookLearningsCard learnings={learnings} />
      ) : null}

      {/* ── Estado primer uso vs. Páginas anteriores ── */}
      {isFirstUse ? (
        <p className="pt-1 text-center font-caption text-fg-muted">
          Esta es tu primera página.
        </p>
      ) : (
        <NotebookPastGrid pastPages={data.pastPages} />
      )}
    </div>
  )
}
