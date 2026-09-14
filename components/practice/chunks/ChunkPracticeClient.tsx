'use client'

// Planned structure:
// <ChunkPracticeClient>
//   <LoadingState | ErrorState />
//   <ChunkStudyPanel />
//   <PracticeSession />
// </ChunkPracticeClient>

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { normalizeCEFR } from '@/lib/exercises/cefr'
import type { ChunkPracticeSession } from '@/lib/chunk-of-day/queries'
import type { ChunkEvidenceRecord } from '@/lib/db'
import Button from '@/components/ui/Button'
import { ChunkStudyPanel } from './ChunkStudyPanel'

type State = { status: 'loading' } | { status: 'error' } | {
  status: 'ready'
  session: ChunkPracticeSession
  evidenceByChunk: Record<string, ChunkEvidenceRecord>
}

export function ChunkPracticeClient() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const { preferences } = useUserPreferences()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [practicing, setPracticing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const level = normalizeCEFR(preferences?.cefr_level ?? 'B1')
  const focusedChunkId = searchParams.get('chunk')
  const pronunciationFocus = searchParams.get('focus') === 'pronunciation'

  useEffect(() => {
    if (!user) return
    let active = true
    setState({ status: 'loading' })
    const sessionPromise = focusedChunkId
      ? import('@/lib/chunk-of-day/focused-session').then(({ loadFocusedChunkPracticeSession }) =>
          loadFocusedChunkPracticeSession(
            focusedChunkId, level, pronunciationFocus ? 'pronunciation' : 'default',
          ))
      : import('@/lib/chunk-of-day/queries').then(({ loadChunkPracticeSession }) =>
          loadChunkPracticeSession(user.id, level))
    sessionPromise
      .then(async (session) => {
        if (!session) throw new Error('Unknown or unavailable chunk')
        const { loadChunkEvidence } = await import('@/lib/chunk-of-day/evidence')
        const evidenceByChunk = await loadChunkEvidence(user.id, session.chunks.map((chunk) => chunk.id))
        return { session, evidenceByChunk }
      })
      .then(({ session, evidenceByChunk }) => { if (active) setState({ status: 'ready', session, evidenceByChunk }) })
      .catch(() => { if (active) setState({ status: 'error' }) })
    return () => { active = false }
  }, [focusedChunkId, level, pronunciationFocus, refreshKey, user])

  if (state.status === 'loading') return <p className="py-10 text-center text-body text-fg-muted" role="status">Preparando tus chunks…</p>
  if (state.status === 'error') return <div className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-6 text-center"><p className="text-body text-fg-muted">No pudimos preparar la práctica.</p><Button className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button></div>
  if (!practicing) return <ChunkStudyPanel chunks={state.session.chunks} evidenceByChunk={state.evidenceByChunk} focus={pronunciationFocus ? 'pronunciation' : 'default'} onStart={() => setPracticing(true)} />
  const finishPractice = () => {
    setPracticing(false)
    setRefreshKey((value) => value + 1)
  }
  return <PracticeSession context="practice" exercises={state.session.exercises} sessionLength={state.session.exercises.length} sessionLabel="Chunks en contexto" onSessionComplete={finishPractice} onExit={finishPractice} />
}
