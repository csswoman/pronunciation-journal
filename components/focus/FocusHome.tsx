'use client'

// Planned structure:
// <FocusHome>
//   <SprintHeader />
//   <SprintProgress />
//   <ContentGrid />
//   <GenerateAdditionalAssets />
// </FocusHome>

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { SprintProgress } from './SprintProgress'
import { FocusContentCard } from './FocusContentCard'
import { saveFocusContent } from '@/lib/focus/queries'
import { deriveExercisesFromContent } from '@/lib/focus/exercise-builder'
import type { FocusSprint, FocusContent, FocusContentKind } from '@/lib/focus/types'

interface FocusHomeProps {
  sprint: FocusSprint
  initialContent: FocusContent[]
  userId: string
  isAnonymous?: boolean
}

export function FocusHome({ sprint, initialContent, userId, isAnonymous = false }: FocusHomeProps) {
  const [contentList, setContentList] = useState<FocusContent[]>(initialContent)
  const [generatingKind, setGeneratingKind] = useState<FocusContentKind | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const availableKinds: FocusContentKind[] = ['drill', 'dialogue', 'error_trap', 'song']

  const handleGenerateAsset = async (kind: FocusContentKind) => {
    setGeneratingKind(kind)
    setErrorMessage(null)

    try {
      const endpoint = `/api/gemini/focus/generate-${kind.replace('_', '-')}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gaps: sprint.gaps,
          level: sprint.gaps[0]?.level ?? 'a2',
        }),
      })

      if (!res.ok) {
        throw new Error(`Error al generar el contenido (${kind}).`)
      }

      const body = await res.json()
      const contentId = crypto.randomUUID()
      const exercises = deriveExercisesFromContent(contentId, kind, body, sprint.gaps[0]?.targetId)

      const newContent: FocusContent = {
        id: contentId,
        sprintId: sprint.id,
        kind,
        gapIds: sprint.gaps.map((g) => g.targetId),
        body,
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

      await saveFocusContent(newContent, userId)
      setContentList((prev) => [...prev, newContent])
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado al generar.')
    } finally {
      setGeneratingKind(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header del Sprint */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge label="Sprint Activo" variant="success" size="sm" dot />
          {sprint.gaps.map((gap) => (
            <Badge key={gap.targetId} label={gap.label} variant="neutral" size="sm" />
          ))}
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Tu Semana de Foco
        </h1>
        <p className="text-body-sm text-[var(--text-secondary)] mt-1">
          Material pedagógico generado a medida para cerrar tus brechas. Practica a tu propio ritmo.
        </p>

        {isAnonymous && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)] flex items-center gap-3 text-body-sm text-[var(--text-secondary)]">
            <span>💾</span>
            <span>
              <strong>Progreso guardado localmente:</strong> Tus ejercicios y notas de este sprint están en este navegador. Para sincronizarlos en la nube, inicia sesión.
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <SprintProgress sprint={sprint} />

      {/* Grid de contenido disponible */}
      <div className="mb-8">
        <h3 className="text-body font-semibold text-[var(--text-primary)] mb-3">
          Contenido para Digerir y Practicar
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contentList.map((content) => (
            <FocusContentCard key={content.id} content={content} sprintId={sprint.id} />
          ))}
        </div>
      </div>

      {/* Mensaje de error si falla la generación */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--badge-error-bg)] text-[var(--text-error)] text-body-sm">
          {errorMessage}
        </div>
      )}

      {/* Generar más tipos de contenido pedagógico */}
      <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
        <h4 className="text-body-sm font-semibold text-[var(--text-primary)] mb-1">
          ¿Quieres más variedad de práctica para este gap?
        </h4>
        <p className="text-tiny text-[var(--text-secondary)] mb-4">
          Genera nuevos formatos pedagógicos sobre tus mismos objetivos:
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {availableKinds.map((kind) => {
            const hasAlready = contentList.some((c) => c.kind === kind)
            const labelMap: Record<FocusContentKind, string> = {
              story: 'Historia',
              drill: 'Drill de frases',
              dialogue: 'Diálogo',
              error_trap: 'Trampa de errores',
              song: 'Canción/Rima',
            }

            return (
              <Button
                key={kind}
                variant="secondary"
                size="sm"
                onClick={() => handleGenerateAsset(kind)}
                disabled={generatingKind !== null}
                isLoading={generatingKind === kind}
              >
                + {labelMap[kind]} {hasAlready ? '(otro)' : ''}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
