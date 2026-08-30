'use client'

// Planned structure:
// <NotebookHomeView>
//   <Header: "Tu cuaderno" + totals count (sentences, not words/streaks) />
//   <NotebookTodayCard: today's elevated card />
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
import { NotebookPastGrid } from './NotebookPastGrid'
import { NotebookLearningsCard } from './NotebookLearningsCard'

interface NotebookHomeViewProps {
  initialData?: NotebookHome
  learnings?: {
    recentErrors: Array<{ quote: string; correction: string; type: string; explanationEs: string }>
    recentWords: string[]
  }
  onSelectMode?: (mode: 'guided' | 'blank' | 'pronunciation') => void
}


export function NotebookHomeView({
  initialData = SAMPLE_NOTEBOOK_DATA,
  learnings,
  onSelectMode,
}: NotebookHomeViewProps) {
  const [data, setData] = useState<NotebookHome>(initialData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

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
            {data.totals.sentences} {data.totals.sentences === 1 ? 'frase' : 'frases'} en inglés
          </p>
        )}
      </header>

      {/* ── Tarjeta de la página de hoy (única superficie elevada) ── */}
      <NotebookTodayCard
        today={data.today}
        onSelectMode={onSelectMode}
        onTopicChange={handleTopicChange}
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
