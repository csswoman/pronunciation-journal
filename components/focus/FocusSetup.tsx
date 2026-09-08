'use client'

// Planned structure:
// <FocusSetup>
//   <SetupHeader />
//   <SuggestionsList />
//   <CustomGapsList />
//   <SetupFooter />
// </FocusSetup>

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { GapSuggestionCard } from './GapSuggestionCard'
import { createSprint, saveFocusContent } from '@/lib/focus/queries'
import { deriveExercisesFromContent } from '@/lib/focus/exercise-builder'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'
import type { SprintGap, FocusContent, StoryBody } from '@/lib/focus/types'

interface FocusSetupProps {
  userId: string
  isAnonymous?: boolean
  suggestedGaps: GapSuggestion[]
  curriculumGaps: SprintGap[]
}

export function FocusSetup({ userId, isAnonymous = false, suggestedGaps, curriculumGaps }: FocusSetupProps) {
  const router = useRouter()
  const [selectedGaps, setSelectedGaps] = useState<SprintGap[]>([])
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleToggle = (gap: SprintGap) => {
    setSelectedGaps((prev) => {
      const exists = prev.some((g) => g.targetId === gap.targetId)
      if (exists) {
        return prev.filter((g) => g.targetId !== gap.targetId)
      }
      if (prev.length >= 2) {
        // Máximo 2 gaps por sprint
        return [prev[1], gap]
      }
      return [...prev, gap]
    })
  }

  const handleStartSprint = async () => {
    if (selectedGaps.length === 0) return
    setIsGenerating(true)
    setErrorMessage(null)

    try {
      // 1. Crear el sprint en base de datos
      const sprint = await createSprint(userId, selectedGaps, 7)

      // 2. Generar el primer asset de contenido pedagógico (mini-historia)
      const res = await fetch('/api/gemini/focus/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaps: selectedGaps,
          level: selectedGaps[0]?.level ?? 'a2',
        }),
      })

      if (!res.ok) {
        throw new Error('No se pudo generar la historia del sprint.')
      }

      const storyBody: StoryBody = await res.json()
      const contentId = crypto.randomUUID()

      // Derivar ejercicios
      const exercises = deriveExercisesFromContent(
        contentId,
        'story',
        storyBody,
        selectedGaps[0]?.targetId,
      )

      const contentRecord: FocusContent = {
        id: contentId,
        sprintId: sprint.id,
        kind: 'story',
        gapIds: selectedGaps.map((g) => g.targetId),
        body: storyBody,
        exercises,
        media: {
          audioNarrationUrl: null,
          audioSentencesUrls: [],
          imageSceneUrl: null,
          imagePromptUrl: null,
          videoClipUrl: null,
        },
        createdAt: new Date().toISOString(),
      }

      await saveFocusContent(contentRecord, userId)

      // 3. Redirigir a la vista del sprint
      router.push(`/focus/${sprint.id}`)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado al activar el sprint.')
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <span className="text-tiny uppercase tracking-wider font-semibold text-[var(--primary)] block mb-1">
          Modo Foco · 7 Días
        </span>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          Cierra tus Gaps de Inglés
        </h1>
        <p className="text-body text-[var(--text-secondary)]">
          Elige hasta 2 puntos específicos que te cuesten o nunca hayas estudiado bien.
          La app generará contenido original de texto pedagógico centrado exclusivamente en dominarlos esta semana.
        </p>

        {isAnonymous && (
          <div className="mt-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-start gap-3">
            <span className="text-lg">💾</span>
            <div className="text-body-sm">
              <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
                Modo Invitado: Guardado en tu navegador
              </span>
              <span className="text-[var(--text-secondary)] leading-relaxed">
                No has iniciado sesión, así que tu sprint, contenido generado y respuestas se guardan de forma local en tu navegador (IndexedDB). Si limpias tus datos o cambias de dispositivo, no se mantendrán en la nube hasta que inicies sesión.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias basadas en historial */}
      <div className="mb-8">
        <h3 className="text-body font-semibold text-[var(--text-primary)] mb-3">
          Sugerencias para ti
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {suggestedGaps.map((gap) => {
            const isSelected = selectedGaps.some((g) => g.targetId === gap.targetId)
            return (
              <GapSuggestionCard
                key={gap.targetId}
                suggestion={gap}
                selected={isSelected}
                onToggle={() => handleToggle(gap)}
              />
            )
          })}
        </div>
      </div>

      {/* Selector de catálogo curricular alternativo */}
      <div className="mb-8 border-t border-[var(--border-subtle)] pt-6">
        <button
          type="button"
          onClick={() => setIsCustomOpen(!isCustomOpen)}
          className="text-body-sm font-medium text-[var(--primary)] hover:underline flex items-center gap-1.5"
        >
          {isCustomOpen ? '▾ Ocultar otros temas del catálogo' : '▸ Elegir otro tema del currículo'}
        </button>

        {isCustomOpen && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
            {curriculumGaps.map((gap) => {
              const isSelected = selectedGaps.some((g) => g.targetId === gap.targetId)
              return (
                <button
                  key={gap.targetId}
                  type="button"
                  onClick={() => handleToggle(gap)}
                  className={`p-2.5 text-left rounded-lg text-body-sm border transition-colors ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-semibold'
                      : 'border-[var(--border-default)] bg-[var(--surface-base)] text-[var(--text-primary)] hover:bg-[var(--surface-raised)]'
                  }`}
                >
                  {gap.label}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Mensajes de error */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--badge-error-bg)] text-[var(--text-error)] text-body-sm">
          {errorMessage}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]">
        <div>
          <span className="text-body-sm font-semibold text-[var(--text-primary)] block">
            {selectedGaps.length} de 2 seleccionados
          </span>
          <span className="text-tiny text-[var(--text-tertiary)]">
            {selectedGaps.map((g) => g.label).join(' · ') || 'Elige al menos 1 tema'}
          </span>
        </div>
        <Button
          variant="primary"
          onClick={handleStartSprint}
          disabled={selectedGaps.length === 0 || isGenerating}
          isLoading={isGenerating}
        >
          {isGenerating ? 'Generando contenido...' : 'Activar Sprint (7 días)'}
        </Button>
      </div>
    </div>
  )
}
