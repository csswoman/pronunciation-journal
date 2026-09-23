'use client'

// Planned structure:
// <FocusContentViewer>
//   <ContentHeader />
//   <GeneratedMaterial />
//   <ExerciseSummary />
// </FocusContentViewer>

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { recordFocusPractice } from '@/lib/focus/queries'
import type { FocusPracticeAction } from '@/lib/focus/practice-progress'
import { withFocusEvidence } from '@/lib/focus/evidence'
import { savePracticeAnswer } from '@/lib/practice/queries'
import { recordActivitySession } from '@/lib/progress/activity-hub'
import { buildSessionResult } from '@/lib/practice/session-result'
import type { ExerciseResult } from '@/lib/practice/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { FocusDialogueBody } from './FocusDialogueBody'
import { FocusDrillBody } from './FocusDrillBody'
import { FocusExerciseRunner } from './FocusExerciseRunner'
import { FocusErrorTrapPractice } from './FocusErrorTrapPractice'
import { FocusSongVoicePractice } from './FocusSongVoicePractice'
import { AlertCircle, BookOpen, MessageCircle, Music, Target } from '@/components/icons'
import type { DialogueBody, DrillBody, ErrorTrapBody, FocusContent, FocusContentKind, SongBody, StoryBody } from '@/lib/focus/types'

type ViewerMeta = {
  label: string
  tone: PastelTone
  Icon: typeof BookOpen
}

const VIEWER_META: Record<FocusContentKind, ViewerMeta> = {
  story: { label: 'Mini-historia', tone: 'sky', Icon: BookOpen },
  drill: { label: 'Drill de frases', tone: 'butter', Icon: Target },
  dialogue: { label: 'Diálogo', tone: 'mint', Icon: MessageCircle },
  error_trap: { label: 'Trampa de errores', tone: 'coral', Icon: AlertCircle },
  song: { label: 'Canción o rima', tone: 'lilac', Icon: Music },
}

interface FocusContentViewerProps {
  content: FocusContent
  sprintId: string
}

export function FocusContentViewer({ content, sprintId }: FocusContentViewerProps) {
  const { user } = useAuth()
  const [practicing, setPracticing] = useState(false)
  const [progressError, setProgressError] = useState(false)
  const executionId = useRef(crypto.randomUUID())
  const persistenceQueue = useRef(Promise.resolve())
  const meta = VIEWER_META[content.kind]
  const { Icon } = meta
  const onProgress = useCallback((action: FocusPracticeAction) => {
    void recordFocusPractice(user?.id ?? 'guest-local-user', sprintId, content.id, action)
      .then((saved: boolean) => { if (!saved) setProgressError(true) })
      .catch(() => setProgressError(true))
  }, [content.id, sprintId, user?.id])

  const startExercises = () => {
    setPracticing(true)
    if (content.exercises.length > 0) onProgress({ kind: 'started' })
  }

  const restartExecution = useCallback(() => {
    executionId.current = crypto.randomUUID()
  }, [])

  const onResult = useCallback((raw: ExerciseResult) => {
    const result = withFocusEvidence(content, raw, {
      attemptId: `${executionId.current}:${raw.exerciseId}`,
      allowTarget: raw.slug !== 'speak_word',
    })
    onProgress({ kind: 'answered', exerciseId: raw.exerciseId })
    if (!user) return
    persistenceQueue.current = persistenceQueue.current
      .then(() => savePracticeAnswer(user.id, result))
      .catch(() => setProgressError(true))
  }, [content, onProgress, user])

  const onComplete = useCallback((rawResults: ExerciseResult[]) => {
    const results = rawResults.map((raw) => withFocusEvidence(content, raw, {
      attemptId: `${executionId.current}:${raw.exerciseId}`,
      allowTarget: raw.slug !== 'speak_word',
    }))
    onProgress({ kind: 'completed' })
    if (!user || results.length === 0) return
    const activitySessionId = `focus:${executionId.current}`
    persistenceQueue.current = persistenceQueue.current
      .then(async () => { await recordActivitySession(user.id, {
          practiceContext: 'practice',
          activitySessionId,
          sessionResult: buildSessionResult(results),
        })
      })
      .catch(() => setProgressError(true))
  }, [content, onProgress, user])

  return (
    <main className="page-shell page-shell--session">
      <Link href={`/focus/${sprintId}`} className="focus-ring inline-flex min-h-11 items-center text-body-sm font-semibold text-fg-muted hover:text-fg">
        ← Volver a mi semana de foco
      </Link>
      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={meta.label} variant="default" size="sm" />
          <Badge label={content.kind === 'error_trap' ? `${(content.body as ErrorTrapBody).sentences.length} oraciones` : content.kind === 'song' ? 'Práctica oral' : `${content.exercises.length} ejercicios`} variant="neutral" size="sm" />
        </div>
        <h1 className="mt-3 font-display text-h1 text-fg">{contentTitle(content)}</h1>
      </header>

      <PastelCard tone={meta.tone} className="mt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-kicker text-fg-muted">Material generado para tus focos</p>
            <p className="mt-1 text-body-sm text-fg-muted">{content.kind === 'error_trap' ? 'Decide cuáles oraciones tienen error antes de ver las correcciones.' : 'Revisa el material y luego practica con tus ejercicios.'}</p>
          </div>
        </div>
      </PastelCard>

      <section className="mt-6" aria-label="Material de práctica">
        <GeneratedMaterial
          content={content}
          isPracticing={practicing}
          onStartPractice={startExercises}
        />
      </section>
      <section id="focus-exercises-section" className="mt-8" aria-label="Ejercicios de este contenido">
        {content.kind === 'error_trap' ? <FocusErrorTrapPractice body={content.body as ErrorTrapBody} contentId={content.id} onResult={onResult} onComplete={onComplete} onRestart={restartExecution} />
          : content.kind === 'song' ? <FocusSongVoicePractice body={content.body as SongBody} contentId={content.id} onResult={onResult} onComplete={onComplete} onRestart={restartExecution} />
            : practicing ? <FocusExerciseRunner content={content} onResult={onResult} onComplete={onComplete} onRestart={restartExecution} />
              : <Button onClick={startExercises}>Comenzar ejercicios</Button>}
        {progressError && <p className="mt-3 text-body-sm text-error" role="alert">No se pudo guardar el avance del sprint en este dispositivo. Puedes seguir practicando.</p>}
      </section>
    </main>
  )
}

function contentTitle(content: FocusContent) {
  if (content.kind === 'story') return (content.body as StoryBody).title
  if (content.kind === 'song') return (content.body as SongBody).title
  if (content.kind === 'dialogue') return 'Practica el diálogo'
  if (content.kind === 'drill') return 'Fija el patrón con frases'
  return 'Encuentra y corrige el error'
}

function GeneratedMaterial({
  content,
  isPracticing,
  onStartPractice,
}: {
  content: FocusContent
  isPracticing?: boolean
  onStartPractice?: () => void
}) {
  if (content.kind === 'story') {
    const body = content.body as StoryBody
    return <article className="rounded-3xl border border-border-default bg-surface-raised p-6 text-body leading-relaxed text-fg whitespace-pre-line">{body.passage}<p className="mt-5 border-t border-border-default pt-4 text-body-sm text-fg-muted">{body.explanation}</p></article>
  }
  if (content.kind === 'drill') {
    return (
      <FocusDrillBody
        body={content.body as DrillBody}
        isPracticing={isPracticing}
        onStartPractice={onStartPractice}
      />
    )
  }
  if (content.kind === 'dialogue') {
    return (
      <FocusDialogueBody
        body={content.body as DialogueBody}
        isPracticing={isPracticing}
        onStartPractice={onStartPractice}
      />
    )
  }
  if (content.kind === 'error_trap') {
    return <p className="text-body-sm text-fg-muted">Lee cada oración en la actividad de abajo. La solución aparece solo después de responder.</p>
  }
  const body = content.body as SongBody
  return <article className="rounded-3xl border border-border-default bg-surface-raised p-6"><p className="whitespace-pre-line text-body leading-relaxed text-fg">{body.lyrics}</p><p className="mt-5 border-t border-border-default pt-4 text-body-sm text-fg-muted">{body.notes}</p></article>
}
