'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { getMyWords } from '@/lib/word-bank/queries'
import { resolveReaderPassage } from '@/lib/practice/reader/get-passage'
import { getCachedReaderPassage, saveReaderPassage } from '@/lib/db'
import { generateReaderPassage } from '@/lib/practice/reader/queries'
import { pickTargets, type ReaderTargetRow } from '@/lib/practice/reader/select-targets'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { ReaderExercise } from './ReaderExercise'

// Planned structure:
// <ReaderEntry>
//   loads SRS rows → resolves passage → <ReaderExercise /> | empty state

type LoadState =
  | { kind: 'loading' }
  | { kind: 'empty' }
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

    const passage = await resolveReaderPassage({
      userId: user.id,
      targets,
      online: navigator.onLine,
      now: Date.now(),
      getCached: getCachedReaderPassage,
      generate: (uid, t) => generateReaderPassage(uid, t),
      save: saveReaderPassage,
    })
    setState(passage ? { kind: 'ready', passage } : { kind: 'empty' })
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

  return (
    <div className="mx-auto max-w-prose p-6">
      <ReaderExercise passage={state.passage} online={online} onComplete={() => {}} />
    </div>
  )
}
