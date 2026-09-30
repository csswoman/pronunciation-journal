'use client'

// Planned structure:
// <NotebookHomeView>
//   <Header: Kicker "CUADERNO DE INGLÉS" + Title "Tu cuaderno" + Subtitle + "Páginas anteriores" button />
//   <MainTwoColumnGrid:
//     <LeftColumn: <NotebookTodayCard insertedPhrase={insertedPhrase} /> />
//     <RightColumnStack:
//       <UsefulPhrasesCard topic={data.today.topic} onInsertPhrase={handleInsertPhrase} />
//       <JournalPronunciationCard onAddWord={() => setIsPronunciationModalOpen(true)} />
//     />
//   >
//   <JournalPronunciationModal />
//   <NotebookPastGrid pastPages={data.pastPages} />
// </NotebookHomeView>

import { useState, useEffect } from 'react'
import { CalendarDays } from '@/components/icons'
import {
  SAMPLE_NOTEBOOK_DATA,
  type NotebookHome,
  type NotebookTopic,
} from '@/lib/journal/notebook-types'
import { NotebookTodayCard } from './NotebookTodayCard'
import { UsefulPhrasesCard } from './UsefulPhrasesCard'
import { JournalPronunciationCard } from './JournalPronunciationCard'
import { JournalPronunciationModal } from './JournalPronunciationModal'
import { NotebookPastGrid } from './NotebookPastGrid'
import { JournalHistoryModal } from './JournalHistoryModal'
import { JournalEntryViewerModal } from './JournalEntryViewerModal'

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
  userId?: string
  todayDate?: string
}

export function NotebookHomeView({
  initialData = SAMPLE_NOTEBOOK_DATA,
  savedPronunciationWords = EMPTY_WORDS,
  onSelectMode,
  onSavePronunciationWords,
  userId,
  todayDate,
}: NotebookHomeViewProps) {
  const [data, setData] = useState<NotebookHome>(initialData)
  const [isPronunciationModalOpen, setIsPronunciationModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedEntryDate, setSelectedEntryDate] = useState<string | null>(null)
  const [pronunciationWords, setPronunciationWords] = useState<string[]>(savedPronunciationWords)
  const [insertedPhrase, setInsertedPhrase] = useState<string | undefined>(undefined)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    setPronunciationWords(savedPronunciationWords)
  }, [savedPronunciationWords])

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

  function handleInsertPhrase(phrase: string) {
    setInsertedPhrase(phrase)
  }

  return (
    <div className="flex w-full flex-col gap-6">
      {/* ── Encabezado principal del cuaderno ── */}
      <header className="flex flex-col gap-1 py-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-kicker text-kicker sm:text-kicker-lg select-none">
              CUADERNO DE INGLÉS
            </span>
            <h1 className="font-heading text-h1 sm:text-display font-extrabold text-fg leading-none tracking-tight">
              Tu cuaderno
            </h1>
            <p className="font-sans text-body-sm sm:text-body-md text-fg-muted mt-1">
              Una página al día. Tú escribes, la revisión te enseña.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="focus-ring inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 py-2 font-label text-body-sm font-semibold text-fg hover:bg-surface-sunken transition-all shadow-2xs select-none shrink-0"
          >
            <CalendarDays size={16} aria-hidden />
            <span>Páginas anteriores</span>
          </button>
        </div>
      </header>

      {/* ── Grid Principal de 2 Columnas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Tarjeta de la Página de Hoy (Mint) */}
        <div className="lg:col-span-7 xl:col-span-7">
          <NotebookTodayCard
            today={data.today}
            onSelectMode={onSelectMode}
            onTopicChange={handleTopicChange}
            insertedPhrase={insertedPhrase}
          />
        </div>

        {/* Columna Derecha: Tarjetas Apiladas (Butter + Coral) */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
          <UsefulPhrasesCard topic={data.today.topic} onInsertPhrase={handleInsertPhrase} />

          <JournalPronunciationCard
            topic={data.today.topic}
            savedWords={pronunciationWords}
            onAddWord={() => setIsPronunciationModalOpen(true)}
            onInsertWord={handleInsertPhrase}
          />
        </div>
      </div>

      {/* ── Modal de Diario de Pronunciación ── */}
      <JournalPronunciationModal
        isOpen={isPronunciationModalOpen}
        onClose={() => setIsPronunciationModalOpen(false)}
        onSaveWords={handleSaveModalWords}
        existingWords={pronunciationWords}
      />

      {/* ── Sección Inferior: Páginas anteriores ── */}
      <NotebookPastGrid
        pastPages={data.pastPages}
        onViewAll={() => setIsHistoryModalOpen(true)}
        onSelectEntry={(date) => setSelectedEntryDate(date)}
      />

      {userId && (
        <JournalHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          userId={userId}
          excludeDate={todayDate}
          onSelectEntry={(date) => {
            setIsHistoryModalOpen(false)
            setSelectedEntryDate(date)
          }}
        />
      )}

      <JournalEntryViewerModal
        isOpen={!!selectedEntryDate}
        entryDate={selectedEntryDate}
        userId={userId}
        onClose={() => setSelectedEntryDate(null)}
        onBackToHistory={() => {
          setSelectedEntryDate(null)
          setIsHistoryModalOpen(true)
        }}
        onSelectEntry={(date) => setSelectedEntryDate(date)}
      />
    </div>
  )
}
