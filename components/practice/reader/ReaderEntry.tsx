'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getMyWords } from '@/lib/word-bank/queries'
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage, resolveReaderLevel } from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { completeReader } from '@/lib/practice/reader/complete-reader'
import { ReaderExercise } from './ReaderExercise'

// Planned structure:
// <ReaderEntry>
//   loads SRS rows → resolves passage → <ReaderExercise /> | empty state

type LoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; passage: ReaderPassage }

export function ReaderEntry() {
  const { user } = useAuth()
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
      const targets = pickTargets(rows)
      if (!targets) {
        setState({ kind: 'empty' })
        return
      }

      const level = await resolveReaderLevel(user.id)
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
    return <p className="p-6 text-fg">Cargando lectura…</p>
  }

  if (state.kind === 'empty') {
    return (
      <p className="p-6 text-fg">
        Sigue practicando para desbloquear lecturas con tus palabras recientes.
      </p>
    )
  }

  if (state.kind === 'error') {
    return (
      <div className="flex flex-col items-start gap-3 p-6">
        <p role="alert" className="text-sm text-error">
          No se pudo preparar la lectura. Comprueba tu conexión e inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md bg-cta-bg px-4 py-2 text-sm font-semibold text-cta-fg"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-prose p-6">
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
