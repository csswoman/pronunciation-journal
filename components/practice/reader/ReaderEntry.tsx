'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getMyWords } from '@/lib/word-bank/queries'
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage, resolveReaderLevel } from '@/lib/practice/reader/queries'
import Link from 'next/link'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'
import { fetchEssentialWordsForDay } from '@/lib/essential-words/client-fetch'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import { WordCarousel } from '@/components/practice/session/WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'
import Button from '@/components/ui/Button'
import { AlertCircle, BookOpen } from '@/components/icons'
import { ReaderExercise } from './ReaderExercise'

// Planned structure:
// <ReaderEntry>
//   loads SRS rows → fallback to essential words if < 3 → resolves passage
//   loading state: <WordCarousel />
//   ready state: <ReaderExercise />
//   empty/error states: structured Card views

type LoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; passage: ReaderPassage }

export function ReaderEntry() {
  const { user } = useAuth()
  const loadingWords = useLoadingWords()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [online, setOnline] = useState(true)

  useEffect(() => {
    setOnline(navigator.onLine)
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    setState({ kind: 'loading' })

    try {
      const words = await getMyWords()
      const rows: ReaderTargetRow[] = words.map((w) => ({
        srsId: `wb:${w.id}`,
        word: w.text,
        status: w.srs_status ?? 'new',
        nextReview: w.next_review_at ?? '',
      }))
      let targets = pickTargets(rows)
      let isFallback = false

      if (!targets) {
        const dayOfYear = Math.floor(Date.now() / 86_400_000)
        const fallbackWords = await fetchEssentialWordsForDay(dayOfYear, 5)
        if (fallbackWords.length >= 3) {
          targets = fallbackWords.map((w) => ({
            srsId: w.id,
            word: w.text,
          }))
          isFallback = true
        }
      }

      if (!targets) {
        setState({ kind: 'empty' })
        return
      }

      const level = await resolveReaderLevel(user.id, isFallback ? 'A1' : 'B1')
      const passage = await resolveReaderPassage({
        userId: user.id,
        targets,
        online: navigator.onLine,
        now: Date.now(),
        level,
        getCached: getCachedReaderPassage,
        generate: (uid, t) => generateReaderPassage(uid, t, level),
        save: saveReaderPassage,
      })
      setState(passage ? { kind: 'ready', passage } : { kind: 'empty' })
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'No se pudo preparar la lectura.',
      })
    }
  }, [user])

  useEffect(() => {
    void load()
  }, [load])

  if (state.kind === 'loading') {
    return (
      <div className="flex w-full flex-col items-center justify-center rounded-card border border-border-default bg-surface-raised p-8 sm:p-12 shadow-xs min-h-[360px]">
        <WordCarousel words={loadingWords} />
        <p className="mt-3 text-caption text-fg-muted animate-pulse">
          Cargando lectura…
        </p>
      </div>
    )
  }

  if (state.kind === 'empty') {
    return (
      <div className="flex flex-col items-center text-center gap-4 rounded-card border border-border-default bg-surface-raised p-8 sm:p-10 shadow-xs">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <BookOpen className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-md">
          <h2 className="text-h3 text-fg font-medium">Lecturas en preparación</h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Sigue practicando para desbloquear lecturas con tus palabras recientes.
          </p>
        </div>
        <Link
          href="/practice"
          className="inline-flex items-center justify-center rounded-md bg-cta-bg px-4 py-2 text-body-sm font-semibold text-cta-fg transition-opacity hover:opacity-90"
        >
          Practicar vocabulario
        </Link>
      </div>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-center text-center gap-4 rounded-card border border-border-default bg-surface-raised p-8 sm:p-10 shadow-xs">
        <div className="flex size-12 items-center justify-center rounded-full bg-error-soft text-error">
          <AlertCircle className="size-6" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-md">
          <h2 className="text-h3 text-fg font-medium">No se pudo preparar la lectura</h2>
          <p role="alert" className="text-body-sm text-fg-muted text-pretty">
            No se pudo preparar la lectura. Comprueba tu conexión e inténtalo de nuevo.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={() => void load()}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <ReaderExercise
        passage={state.passage}
        online={online}
        onComplete={async (correct) => {
          if (!user) return
          await completeReader({
            userId: user.id,
            passageId: state.passage.id,
            correct,
            context: 'practice',
          })
        }}
      />
    </div>
  )
}
