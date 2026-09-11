'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSprint, deleteSprint, saveFocusContent } from '@/lib/focus/queries'
import { deriveExercisesFromContent } from '@/lib/focus/exercise-builder'
import type { SprintGap, FocusContent, StoryBody } from '@/lib/focus/types'

/** Etapas visibles de la activación, para que la espera no sea una caja negra. */
export type ActivationStage = 'idle' | 'creating' | 'generating' | 'saving'

const STAGE_LABEL: Record<Exclude<ActivationStage, 'idle'>, string> = {
  creating: 'Creando tu sprint...',
  generating: 'Escribiendo tu primera historia...',
  saving: 'Guardando tu contenido...',
}

/**
 * Orquesta la activación de un sprint: crear, generar el primer asset y guardar.
 *
 * Hace rollback del sprint si la generación falla. Sin eso, el sprint quedaba
 * activo y vacío en Dexie, y la siguiente visita a /focus/setup redirigía a un
 * sprint sin contenido del que el usuario no podía salir.
 */
export function useSprintActivation(userId: string) {
  const router = useRouter()
  const [stage, setStage] = useState<ActivationStage>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isActivating = stage !== 'idle'
  const stageLabel = stage === 'idle' ? null : STAGE_LABEL[stage]

  const activate = async (gaps: SprintGap[], durationDays: number) => {
    if (gaps.length === 0 || isActivating) return

    setErrorMessage(null)
    setStage('creating')

    let sprintId: string | null = null

    try {
      const sprint = await createSprint(userId, gaps, durationDays)
      sprintId = sprint.id

      setStage('generating')
      const res = await fetch('/api/gemini/focus/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gaps, level: gaps[0]?.level ?? 'a2' }),
      })

      if (!res.ok) {
        throw new Error('No pudimos generar tu primera historia. Tu selección sigue aquí, inténtalo otra vez.')
      }

      const storyBody: StoryBody = await res.json()
      const contentId = crypto.randomUUID()

      setStage('saving')
      const contentRecord: FocusContent = {
        id: contentId,
        sprintId: sprint.id,
        kind: 'story',
        gapIds: gaps.map((g) => g.targetId),
        body: storyBody,
        exercises: deriveExercisesFromContent(contentId, 'story', storyBody, gaps[0]?.targetId),
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
      router.push(`/focus/${sprint.id}`)
    } catch (err: unknown) {
      // Rollback: un sprint sin contenido bloquearía el setup para siempre.
      if (sprintId) {
        try {
          await deleteSprint(sprintId, userId)
        } catch {
          // El borrado local falló; el mensaje de error sigue siendo el correcto
          // para el usuario y el sprint vacío se limpiará en el próximo ciclo.
        }
      }
      setErrorMessage(err instanceof Error ? err.message : 'Error inesperado al activar el sprint.')
      setStage('idle')
    }
  }

  return { activate, isActivating, stage, stageLabel, errorMessage }
}
