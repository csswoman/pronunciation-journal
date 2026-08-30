'use client'

// Planned structure:
// <NotebookTodayCard>
//   <MetaRow: date + Badge />
//   <TopicSelector: radiogroup pills + shuffle-button />
//   <PromptSection: english (serif) + spanish />
//   <ActionArea:
//     empty: 2 entry cards (guided vs blank)
//     in_progress: preview in serif + resume button
//     done: stats + view page button
//   />
// </NotebookTodayCard>

import { useState } from 'react'
import Link from 'next/link'
import { FileText, Pencil, MicVocal } from '@/components/icons'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  TOPIC_PROMPTS,
  type NotebookHome,
  type NotebookTopic,
} from '@/lib/journal/notebook-types'
import { NotebookTopicSelector } from './NotebookTopicSelector'

interface NotebookTodayCardProps {
  today: NotebookHome['today']
  onSelectMode?: (mode: 'guided' | 'blank' | 'pronunciation') => void
  onTopicChange?: (topic: NotebookTopic) => void
  onShufflePrompt?: () => void
}

export function NotebookTodayCard({
  today,
  onSelectMode,
  onTopicChange,
  onShufflePrompt,
}: NotebookTodayCardProps) {
  const [selectedTopic, setSelectedTopic] = useState<NotebookTopic>(today.topic)
  const [promptIndex, setPromptIndex] = useState(0)

  const activePrompts = TOPIC_PROMPTS[selectedTopic] ?? TOPIC_PROMPTS.daily
  const currentPrompt =
    activePrompts[promptIndex % activePrompts.length] ?? {
      id: today.prompt.id || 'small-win',
      en: today.prompt.en,
      es: today.prompt.es,
    }

  function handleTopicSelect(topic: NotebookTopic) {
    setSelectedTopic(topic)
    setPromptIndex(0)
    onTopicChange?.(topic)
  }

  function handleShuffle() {
    setPromptIndex((prev) => prev + 1)
    onShufflePrompt?.()
  }

  const promptId = currentPrompt.id || 'small-win'
  // Reabrir el mismo editor con el que se escribió la entrada (guiado vs. blanco vs. pronunciación).
  const resumeHref = `/journal/write?mode=${today.entryMode ?? 'blank'}&promptId=${encodeURIComponent(promptId)}&topic=${today.topic}`

  return (
    <article
      aria-labelledby="today-page-heading"
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised layout-card-pad"
    >
      {/* Fila meta: Fecha a la izquierda, Badge semántico a la derecha */}
      <div className="flex items-center justify-between gap-2">
        <time dateTime={today.date} className="font-caption text-fg-muted">
          {formatLongDate(today.date)}
        </time>

        {today.status === 'empty' && (
          <Badge label="Página de hoy" variant="default" size="sm" />
        )}
        {today.status === 'in_progress' && (
          <Badge label="En progreso" variant="info" size="sm" />
        )}
        {today.status === 'done' && (
          <Badge label="Terminada" variant="success" size="sm" />
        )}
      </div>

      {/* Selector de tema: solo activo cuando no está terminada */}
      {today.status !== 'done' && (
        <NotebookTopicSelector
          selectedTopic={selectedTopic}
          onSelectTopic={handleTopicSelect}
          onShuffle={handleShuffle}
        />
      )}

      {/* Pregunta en inglés (voz serif) + traducción (sans secundaria) */}
      <div className="flex flex-col gap-1">
        <h2
          id="today-page-heading"
          className="font-serif font-h3 font-normal leading-snug text-fg text-balance"
        >
          {currentPrompt.en}
        </h2>
        <p className="font-body-sm text-fg-muted">
          {currentPrompt.es}
        </p>
      </div>

      {/* ── Estado EMPTY: Tres tarjetas de entrada ── */}
      {today.status === 'empty' && (
        <div className="mt-1 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {/* Opción A: Completar frases */}
          <Link
            href={`/journal/write?mode=guided&promptId=${encodeURIComponent(promptId)}&topic=${selectedTopic}`}
            onClick={(e) => {
              if (onSelectMode) {
                e.preventDefault()
                onSelectMode('guided')
              }
            }}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-fg-muted transition-colors group-hover:text-fg">
                <FileText size={18} aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body-sm font-medium text-fg">
                  Completar frases
                </span>
                <span className="font-caption text-fg-muted leading-normal">
                  Estructuras sugeridas para redactar hoy.
                </span>
              </div>
            </div>
          </Link>

          {/* Opción B: Página en blanco */}
          <Link
            href={`/journal/write?mode=blank&promptId=${encodeURIComponent(promptId)}&topic=${selectedTopic}`}
            onClick={(e) => {
              if (onSelectMode) {
                e.preventDefault()
                onSelectMode('blank')
              }
            }}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-fg-muted transition-colors group-hover:text-fg">
                <Pencil size={18} aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body-sm font-medium text-fg">
                  {selectedTopic === 'free' ? 'Escribir libremente' : 'Página en blanco'}
                </span>
                <span className="font-caption text-fg-muted leading-normal">
                  Redacta desde cero a tu propio ritmo.
                </span>
              </div>
            </div>
          </Link>

          {/* Opción C: Diario de pronunciación */}
          <Link
            href={`/journal/write?mode=pronunciation&promptId=${encodeURIComponent(promptId)}&topic=${selectedTopic}`}
            onClick={(e) => {
              if (onSelectMode) {
                e.preventDefault()
                onSelectMode('pronunciation')
              }
            }}
            className="focus-ring group flex flex-col justify-between gap-3 rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken p-4 transition-colors hover:border-border-strong"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-accent-1 transition-colors group-hover:text-fg">
                <MicVocal size={18} aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-body-sm font-medium text-fg">
                  Diario de pronunciación
                </span>
                <span className="font-caption text-fg-muted leading-normal">
                  Registra palabras y sonidos difíciles.
                </span>
              </div>
            </div>
          </Link>
        </div>
      )}


      {/* ── Estado IN PROGRESS: Primera línea en serif + botones de acción ── */}
      {today.status === 'in_progress' && (
        <div className="mt-1 flex flex-col gap-3 rounded-[var(--radius-sm)] bg-surface-sunken p-4">
          {today.preview && (
            <p className="line-clamp-2 font-serif font-body-sm italic text-fg">
              “{today.preview}”
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link href={resumeHref}>
              <Button variant="primary" size="sm">
                Seguir editando
              </Button>
            </Link>
            <Link href={`/journal/${today.date}`}>
              <Button variant="secondary" size="sm">
                Ver página
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Estado DONE: Acumulado de la entrada + preview + botón ver página ── */}
      {today.status === 'done' && (
        <div className="mt-1 flex flex-col gap-3 rounded-[var(--radius-sm)] bg-surface-sunken p-4">
          {today.preview && (
            <p className="line-clamp-2 font-serif font-body-sm italic text-fg">
              “{today.preview}”
            </p>
          )}
          <p className="font-caption text-fg-muted">
            {today.sentences ?? 0} {today.sentences === 1 ? 'frase' : 'frases'} ·{' '}
            {today.newWords ?? 0} {today.newWords === 1 ? 'palabra nueva' : 'palabras nuevas'}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/journal/${today.date}`}>
              <Button variant="primary" size="sm">
                Ver página
              </Button>
            </Link>
            <Link href={resumeHref}>
              <Button variant="secondary" size="sm">
                Escribir otra vez
              </Button>
            </Link>
          </div>
        </div>
      )}
    </article>
  )
}

function formatLongDate(dateStr: string): string {
  try {
    const date = new Date(`${dateStr}T12:00:00`)
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return dateStr
  }
}
