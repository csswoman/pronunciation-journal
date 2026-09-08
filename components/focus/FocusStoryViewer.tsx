'use client'

// Planned structure:
// <FocusStoryViewer>
//   <StoryHeader />
//   <MediaBanner />
//   <StoryPassageCard />
//   <MicroExplanationCard />
//   <KeyPhrasesList />
//   <ExercisesSection />
// </FocusStoryViewer>

import React, { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { FocusContent, StoryBody } from '@/lib/focus/types'
import type { FillBlankExercise } from '@/lib/exercises/types'

interface FocusStoryViewerProps {
  content: FocusContent
  sprintId: string
}

export function FocusStoryViewer({ content, sprintId }: FocusStoryViewerProps) {
  const body = content.body as StoryBody
  const [activeTab, setActiveTab] = useState<'read' | 'practice'>('read')
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({})

  // Resaltado de keyPhrases en el texto
  const renderHighlightedPassage = () => {
    const text = body.passage
    if (!body.keyPhrases || body.keyPhrases.length === 0) {
      return <p className="text-body text-[var(--text-primary)] leading-relaxed whitespace-pre-line">{text}</p>
    }

    // Dividir y resaltar
    const phrasesRegex = new RegExp(
      `(${body.keyPhrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
      'gi',
    )
    const parts = text.split(phrasesRegex)

    return (
      <p className="text-body text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
        {parts.map((part, index) => {
          const isKey = body.keyPhrases.some(
            (kp) => kp.toLowerCase() === part.toLowerCase(),
          )
          if (isKey) {
            return (
              <mark
                key={index}
                className="bg-[var(--primary-soft)] text-[var(--primary)] font-semibold rounded px-1 py-0.5"
              >
                {part}
              </mark>
            )
          }
          return <span key={index}>{part}</span>
        })}
      </p>
    )
  }

  const fillExercises = content.exercises.filter((ex) => ex.type === 'fill_blank') as FillBlankExercise[]

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Navegación y Header */}
      <div className="mb-6">
        <Link
          href={`/focus/${sprintId}`}
          className="text-body-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3 inline-block"
        >
          ← Volver a mi semana de foco
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <Badge label="Mini-Historia" variant="default" size="sm" />
          <Badge label={`${content.exercises.length} ejercicios`} variant="success" size="sm" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {body.title}
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border-default)] mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('read')}
          className={`pb-3 px-4 text-body-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'read'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          📖 Leer e Interiorizar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={`pb-3 px-4 text-body-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'practice'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          ✍️ Ejercicios ({content.exercises.length})
        </button>
      </div>

      {/* Media: Audio o Imagen si existen en Supabase */}
      {content.media.audioNarrationUrl && (
        <div className="mb-6 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-center justify-between">
          <span className="text-body-sm font-medium text-[var(--text-primary)]">
            🎙️ Narración del autor
          </span>
          <audio controls src={content.media.audioNarrationUrl} className="h-9" />
        </div>
      )}

      {content.media.imageSceneUrl && (
        <div className="mb-6 rounded-xl overflow-hidden border border-[var(--border-default)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={content.media.imageSceneUrl}
            alt={body.title}
            className="w-full max-h-72 object-cover"
          />
        </div>
      )}

      {activeTab === 'read' ? (
        <div className="space-y-6">
          {/* Tarjeta del pasaje */}
          <div className="p-6 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-default)] shadow-xs">
            {renderHighlightedPassage()}
          </div>

          {/* Micro-explicación pedagógica */}
          <div className="p-5 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]">
            <h4 className="text-body-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
              💡 Por qué importa este patrón:
            </h4>
            <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">
              {body.explanation}
            </p>
          </div>

          {/* Frases clave detectadas */}
          {body.keyPhrases && body.keyPhrases.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-[var(--text-secondary)] mb-2">
                Frases con el patrón en la historia:
              </h4>
              <div className="flex flex-wrap gap-2">
                {body.keyPhrases.map((phrase, idx) => (
                  <span
                    key={idx}
                    className="text-body-sm px-3 py-1 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-primary)] font-medium"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={() => setActiveTab('practice')}>
              Ir a los ejercicios →
            </Button>
          </div>
        </div>
      ) : (
        /* Tab de ejercicios derivados */
        <div className="space-y-6">
          <p className="text-body-sm text-[var(--text-secondary)]">
            Completa los huecos utilizando el patrón gramatical de la historia:
          </p>

          {fillExercises.map((ex, exIndex) => {
            const isSubmitted = submitted[ex.id]
            const selected = selectedAnswers[ex.id]
            const isCorrect = selected === ex.answer

            return (
              <div
                key={ex.id}
                className="p-5 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]"
              >
                <div className="text-tiny text-[var(--text-tertiary)] mb-2 font-mono">
                  Pregunta {exIndex + 1} de {fillExercises.length}
                </div>
                <div className="text-body font-medium text-[var(--text-primary)] mb-4">
                  {ex.sentence}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  {ex.options.map((opt, optIndex) => {
                    const isOptionSelected = selected === opt
                    return (
                      <button
                        key={optIndex}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setSelectedAnswers((prev) => ({ ...prev, [ex.id]: opt }))}
                        className={`p-2.5 rounded-lg border text-body-sm text-left transition-colors ${
                          isOptionSelected
                            ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                            : 'border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)]'
                        }`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>

                {!isSubmitted ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!selected}
                    onClick={() => setSubmitted((prev) => ({ ...prev, [ex.id]: true }))}
                  >
                    Comprobar respuesta
                  </Button>
                ) : (
                  <div
                    className={`p-3 rounded-lg text-body-sm font-medium ${
                      isCorrect
                        ? 'bg-[var(--badge-success-bg)] text-[var(--text-success)]'
                        : 'bg-[var(--badge-error-bg)] text-[var(--text-error)]'
                    }`}
                  >
                    {isCorrect ? '¡Correcto!' : `Incorrecto. La respuesta correcta era: "${ex.answer}"`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
