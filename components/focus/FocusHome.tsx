'use client'

// Planned structure:
// <FocusHome>
//   <SprintHeader />
//   <SprintProgress />
//   <ContentGridHeader />
//   <ContentGrid>
//     <MiniStoryFeaturedCard />
//     <DrillCard />
//     <DialogueCard />
//     <ErrorTrapCard />
//     <SongCard />
//   </ContentGrid>
//   <PedagogicalNoticeFooter />
// </FocusHome>

import React, { useState } from 'react'
import Link from 'next/link'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { SprintProgress } from './SprintProgress'
import { saveFocusContent } from '@/lib/focus/queries'
import { deriveExercisesFromContent } from '@/lib/focus/exercise-builder'
import { focusContentHref } from '@/lib/focus/content-url'
import { hardestGapLevel } from '@/lib/focus/types'
import { getIllustration } from '@/lib/illustrations/registry'
import {
  Sparkles,
  Target,
  MessageCircle,
  AlertCircle,
  Music,
  Loader2,
} from '@/components/icons'
import type { FocusSprint, FocusContent, FocusContentKind } from '@/lib/focus/types'

interface FocusHomeProps {
  sprint: FocusSprint
  initialContent: FocusContent[]
  userId: string
  isAnonymous?: boolean
}

type CardSpec = {
  kind: FocusContentKind
  title: string
  description: string
  tone: PastelTone
  icon: React.ElementType
}

const CARDS_SPEC: CardSpec[] = [
  {
    kind: 'story',
    title: 'Mini-historia',
    description: 'Lectura inmersiva con tus dos contrastes dentro, ejercicios y microexplicación.',
    tone: 'sky',
    icon: Target,
  },
  {
    kind: 'drill',
    title: 'Drill de frases',
    description: 'Oraciones guiadas para fijar la estructura sin pensarla.',
    tone: 'butter',
    icon: Target,
  },
  {
    kind: 'dialogue',
    title: 'Diálogo',
    description: 'Conversación donde el patrón cobra sentido.',
    tone: 'mint',
    icon: MessageCircle,
  },
  {
    kind: 'error_trap',
    title: 'Trampa de errores',
    description: 'Detectar el fallo frecuente frente al uso correcto.',
    tone: 'coral',
    icon: AlertCircle,
  },
  {
    kind: 'song',
    title: 'Canción o rima',
    description: 'Cadencia auditiva para retener a largo plazo.',
    tone: 'lilac',
    icon: Music,
  },
]

export function FocusHome({ sprint, initialContent, userId, isAnonymous = false }: FocusHomeProps) {
  const [contentList, setContentList] = useState<FocusContent[]>(initialContent)
  const [generatingKind, setGeneratingKind] = useState<FocusContentKind | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const StoryIllustration = getIllustration('domainReading')

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
          level: hardestGapLevel(sprint.gaps),
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
      setErrorMessage(err instanceof Error ? err.message : 'Error al generar.')
    } finally {
      setGeneratingKind(null)
    }
  }

  const renderCard = (spec: CardSpec) => {
    const existingContent = contentList.find((c) => c.kind === spec.kind)
    const isGenerating = generatingKind === spec.kind
    const exercisesCount = existingContent?.exercises?.length ?? 4
    const isFeatured = spec.kind === 'story'
    const Icon = spec.icon

    if (isFeatured) {
      return (
        <PastelCard
          key={spec.kind}
          tone={spec.tone}
          className="col-span-1 md:col-span-2 rounded-3xl p-6 sm:p-7 relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden text-left shadow-xs"
        >
          <div className="flex flex-col gap-3 max-w-lg">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-text px-3.5 py-1 ts-kicker text-surface">
                {existingContent ? 'YA GENERADO' : 'DESTACADO'}
              </span>
              <span className="rounded-full bg-white/80 border border-black/10 px-3 py-1 ts-chip text-ink">
                {exercisesCount} ejercicios
              </span>
              <span className="rounded-full bg-white/80 border border-black/10 px-3 py-1 ts-chip text-ink">
                6 min
              </span>
            </div>

            <div>
              <h3 className="ts-headline-xl text-ink">
                {spec.title}
              </h3>
              <p className="ts-body text-ink-secondary mt-1.5 leading-relaxed">
                {spec.description}
              </p>
            </div>

            <div className="mt-2">
              {existingContent ? (
                <Link
                  href={focusContentHref(existingContent.id)}
                  className="focus-ring inline-flex items-center gap-2 rounded-full bg-text hover:bg-black text-surface ts-button px-6 py-2.5 shadow-md transition-all"
                >
                  <span>Practicar ahora</span>
                  <span>→</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => handleGenerateAsset(spec.kind)}
                  disabled={generatingKind !== null}
                  className="focus-ring inline-flex items-center gap-2 rounded-full bg-text hover:bg-black text-surface ts-button px-6 py-2.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin text-surface" /> : <span>+ Generar</span>}
                </button>
              )}
            </div>
          </div>

          <StoryIllustration
            className="h-28 sm:h-36 w-auto text-ink opacity-85 shrink-0 pointer-events-none self-end md:self-center"
            aria-hidden="true"
          />
        </PastelCard>
      )
    }

    return (
      <PastelCard
        key={spec.kind}
        tone={spec.tone}
        className="rounded-3xl p-6 flex flex-col justify-between gap-4 text-left shadow-xs"
      >
        <div className="flex flex-col gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/10 text-ink">
            <Icon className="h-5 w-5 text-ink" aria-hidden="true" />
          </div>
          <div>
            <h3 className="ts-headline text-ink">
              {spec.title}
            </h3>
            <p className="ts-body text-ink-secondary mt-1 leading-relaxed">
              {spec.description}
            </p>
          </div>
        </div>

        <div>
          {existingContent ? (
            <Link
              href={focusContentHref(existingContent.id)}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/80 hover:bg-white border border-black/10 text-ink ts-button px-4 py-2 shadow-xs transition-all"
            >
              <span>Practicar ahora</span>
              <span>→</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => handleGenerateAsset(spec.kind)}
              disabled={generatingKind !== null}
              className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-white/80 hover:bg-white border border-black/10 text-ink ts-button px-4 py-2 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-ink" />
              ) : (
                <span>+ Generar</span>
              )}
            </button>
          )}
        </div>
      </PastelCard>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 text-left">
      {/* Header del Sprint */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 ts-badge text-on-primary shadow-xs">
            <span className="h-2 w-2 rounded-full bg-on-primary animate-pulse" />
            Sprint activo
          </span>
          {sprint.gaps.map((gap) => (
            <span
              key={gap.targetId}
              className="rounded-full bg-white border border-black/10 px-3.5 py-1 ts-chip text-ink shadow-xs"
            >
              {gap.label}
            </span>
          ))}
        </div>

        <h1 className="ts-display text-fg">
          Tu semana de foco
        </h1>
        <p className="ts-body-lg-meta text-fg-muted mt-1">
          Material hecho a medida para cerrar tus brechas. Practica a tu ritmo.
        </p>

        {isAnonymous && (
          <div className="mt-3 p-3.5 rounded-2xl bg-surface-raised border border-border-default flex items-center gap-3 ts-body text-fg-muted shadow-xs">
            <span>💾</span>
            <span>
              <strong className="text-fg ts-body-lg-strong">Progreso guardado localmente:</strong> Tus ejercicios y notas de este sprint están guardados en este navegador. Para sincronizarlos en la nube, inicia sesión cuando quieras.
            </span>
          </div>
        )}
      </div>

      {/* Barra de progreso con Ilustración Koboyo sin marco punteado */}
      <SprintProgress sprint={sprint} />

      {/* Grid de contenido disponible */}
      <div className="mb-8">
        <span className="ts-kicker text-fg-subtle">
          CONTENIDO DE ESTA SEMANA
        </span>
        <h2 className="ts-headline text-fg mt-0.5 mb-5">
          Para digerir y practicar
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {CARDS_SPEC.map(renderCard)}
        </div>
      </div>

      {/* Mensaje de error si falla la generación */}
      {errorMessage && (
        <div className="mb-4 p-4 rounded-2xl bg-red-100 text-red-700 ts-body font-semibold">
          {errorMessage}
        </div>
      )}

      {/* Banner de aviso pedagógico al pie */}
      <div className="mt-8 rounded-full border border-border-default bg-surface-raised p-4 px-6 shadow-xs flex items-center gap-3.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-text text-surface">
          <Sparkles className="h-4 w-4 text-surface" aria-hidden="true" />
        </div>
        <p className="ts-body text-fg-muted">
          Todos los formatos trabajan tus <strong className="text-fg ts-body-lg-strong">mismos dos objetivos</strong>. No repiten el contenido: cambian la forma de practicarlo.
        </p>
      </div>
    </div>
  )
}
