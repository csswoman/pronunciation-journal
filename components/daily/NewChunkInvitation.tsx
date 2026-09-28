'use client'

// <NewChunkInvitation>
//   <InvitationHeader />
//   <AuthoredChunkPreview />
//   <FocusedPracticeLink />

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { LearningChunk } from '@/lib/chunk-of-day/types'

interface Props { userId: string | null }

type Suggestion =
  | { status: 'loading' }
  | { status: 'ready'; chunk: LearningChunk | null }
  | { status: 'unavailable' }

export default function NewChunkInvitation({ userId }: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion>({ status: 'loading' })

  useEffect(() => {
    if (!userId) {
      setSuggestion({ status: 'unavailable' })
      return
    }
    let active = true
    setSuggestion({ status: 'loading' })
    async function load() {
      try {
        const [{ getEffectiveLearnerLevel }, { loadDailyChunkIntroStep }] = await Promise.all([
          import('@/lib/learner-level/client-queries'),
          import('@/lib/chunk-of-day/queries'),
        ])
        const level = await getEffectiveLearnerLevel(userId!)
        const step = await loadDailyChunkIntroStep(userId!, level.level, 0)
        if (active) setSuggestion({ status: 'ready', chunk: step?.chunks?.[0] ?? null })
      } catch {
        if (active) setSuggestion({ status: 'unavailable' })
      }
    }
    void load()
    return () => { active = false }
  }, [userId])

  if (suggestion.status === 'loading') {
    return (
      <section aria-label="Descubrir una expresión" aria-busy="true" className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-[var(--layout-card-pad)]">
        <p className="font-kicker text-fg-muted">PARA DESCUBRIR</p>
        <p className="mt-2 text-body-sm text-fg-muted">Buscando una expresión para ti…</p>
      </section>
    )
  }
  const chunk = suggestion.status === 'ready' ? suggestion.chunk : null

  return (
    <section aria-label="Descubrir una expresión" className="rounded-[var(--radius-md)] border border-border-default bg-surface-raised p-[var(--layout-card-pad)]">
      <p className="font-kicker text-fg-muted">PARA DESCUBRIR</p>
      {chunk ? (
        <>
          <h2 className="mt-2 text-h3 text-fg" lang="en">{chunk.contentGraph?.text ?? chunk.chunk}</h2>
          <p className="mt-1 text-body-sm text-fg-muted">{chunk.meaning}</p>
          <p className="mt-2 text-caption text-fg-muted">Escúchala y úsala en contexto. La práctica registra tus respuestas.</p>
          <Link className="focus-ring mt-4 inline-flex min-h-11 items-center font-label text-primary hover:underline" href={`/practice/chunks?chunk=${encodeURIComponent(chunk.id)}`}>
            Aprender esta expresión
          </Link>
        </>
      ) : (
        <>
          <h2 className="mt-2 text-h3 text-fg">Explora algo nuevo</h2>
          <p className="mt-1 text-body-sm text-fg-muted">
            {suggestion.status === 'unavailable' ? 'No pudimos comprobar qué expresión te corresponde.' : 'No encontramos otra expresión disponible para tu nivel.'}
          </p>
          <Link className="focus-ring mt-4 inline-flex min-h-11 items-center font-label text-primary hover:underline" href="/courses">
            Explorar la Ruta
          </Link>
        </>
      )}
    </section>
  )
}
