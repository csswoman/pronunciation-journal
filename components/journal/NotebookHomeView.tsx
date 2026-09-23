'use client'

// Planned structure:
// <NotebookHomeView>
//   <Header: Kicker "CUADERNO DE INGLÉS" + Title "Tu cuaderno" + Badges row + "Páginas anteriores" button />
//   <NotebookTodayCard: Mint PastelCard main writing card />
//   <JournalPronunciationCard: Coral PastelCard pronunciation journal card />
//   <JournalPronunciationModal: interactive modal for adding/editing words />
//   {learnings ? <NotebookLearningsCard /> : null}
//   {pastPages.length === 0 ? <FirstUseHint /> : <NotebookPastGrid />}
// </NotebookHomeView>

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CalendarDays } from '@/components/icons'
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
      {/* ── Encabezado Canónico alineado con media_1789762138983.png ── */}
      <header className="flex flex-col gap-3 py-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-kicker uppercase tracking-wider text-secondary select-none">
              CUADERNO DE INGLÉS
            </span>
            <h1 className="font-heading text-hero sm:text-display font-extrabold text-fg leading-none tracking-tight">
              Tu cuaderno
            </h1>
          </div>

          <Link
            href="/journal/history"
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 py-2 font-label text-body-sm font-semibold text-fg hover:bg-surface-sunken transition-all shadow-2xs select-none shrink-0"
          >
            <CalendarDays size={16} aria-hidden />
            <span>Páginas anteriores</span>
          </Link>
        </div>

        {/* Badges en píldoras debajo del título */}
        {!isFirstUse && data.totals && (data.totals.pages > 0 || data.totals.sentences > 0) ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-raised px-3.5 py-1 font-sans text-caption font-medium text-fg select-none">
              {data.totals.pages} {data.totals.pages === 1 ? 'página' : 'páginas'}
            </span>
            <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-raised px-3.5 py-1 font-sans text-caption font-medium text-fg select-none">
              {data.totals.sentences} {data.totals.sentences === 1 ? 'frase' : 'frases'} en inglés
            </span>
            <span className="inline-flex items-center rounded-full bg-mint px-3.5 py-1 font-sans text-caption font-bold text-ink select-none">
              1 día seguido
            </span>
          </div>
        ) : null}
      </header>

      {/* ── Tarjeta principal de la página de hoy (Mint PastelCard) ── */}
      <NotebookTodayCard
        today={data.today}
        onSelectMode={onSelectMode}
        onTopicChange={handleTopicChange}
      />

      {/* ── Tarjeta del Diario de Pronunciación (Coral PastelCard) ── */}
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
