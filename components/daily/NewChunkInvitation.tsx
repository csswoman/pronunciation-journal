'use client'

// <NewChunkInvitation>
//   <PastelCard tone="mint">
//     <InvitationHeader />
//     <ChunkMainInfo />
//     <ExampleCard />
//     <LearnCTA />
//   </PastelCard>
// </NewChunkInvitation>

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PastelCard from '@/components/layout/PastelCard'
import { Volume2, ArrowRight } from '@/components/icons'
import { speakText } from '@/lib/speech/synthesis'
import { chunkExample, type LearningChunk } from '@/lib/chunk-of-day/types'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import { getHeroScale } from '@/lib/home/hero-scale'
import { cn } from '@/lib/cn'

interface Props {
  userId: string | null
}

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
    return () => {
      active = false
    }
  }, [userId])

  if (suggestion.status === 'loading') {
    return (
      <PastelCard tone="mint" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-ink px-3.5 py-1.5 ts-badge text-paper">
            Para descubrir
          </span>
        </div>
        <p className="ts-body text-ink-secondary">Buscando una expresión para ti…</p>
      </PastelCard>
    )
  }

  const chunk = suggestion.status === 'ready' ? suggestion.chunk : null

  if (!chunk) {
    return (
      <PastelCard tone="mint" className="flex flex-col items-start gap-3">
        <span className="rounded-full bg-ink px-3.5 py-1.5 ts-badge text-paper">
          Para descubrir
        </span>
        <h2 className="ts-headline text-ink">Explora algo nuevo</h2>
        <p className="ts-body text-ink-secondary">
          {suggestion.status === 'unavailable'
            ? 'No pudimos comprobar qué expresión te corresponde.'
            : 'No encontramos otra expresión disponible para tu nivel.'}
        </p>
        <Link
          className="focus-ring mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 ts-button text-paper hover:bg-ink/90 active:scale-[0.98]"
          href="/courses"
        >
          <span>Explorar la Ruta</span>
          <ArrowRight size={16} aria-hidden />
        </Link>
      </PastelCard>
    )
  }

  const textToSpeak = chunk.contentGraph?.text ?? chunk.chunk
  const ex = chunkExample(chunk)
  const exampleEn =
    ex?.kind === 'sentence'
      ? ex.en
      : ex?.kind === 'dialogue'
        ? ex.turns[0]?.en
        : chunk.example
  const exampleEs =
    ex?.kind === 'sentence'
      ? ex.es
      : ex?.kind === 'dialogue'
        ? ex.turns[0]?.es
        : chunk.example_translation
  const tagOrCategory =
    chunk.tag || chunk.category || chunk.learning?.communicativeFunction || 'planes y futuro'

  return (
    <PastelCard tone="mint" className="flex flex-col items-start gap-4 p-4 sm:p-6">
      {/* Header pills */}
      <div className="flex w-full items-center justify-between gap-2">
        <span className="rounded-full bg-ink px-3.5 py-1.5 ts-badge text-paper">
          Para descubrir
        </span>
        {tagOrCategory && (
          <span className="rounded-full bg-ink/10 px-3.5 py-1.5 ts-chip text-ink">
            {tagOrCategory}
          </span>
        )}
      </div>

      {/* Title + Audio trigger */}
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2
            className={cn(
              'font-heading font-extrabold text-ink leading-[1.2] break-words tracking-tight',
              getHeroScale(textToSpeak)
            )}
            lang="en"
          >
            {textToSpeak}
          </h2>
          {chunk.ipa && (
            <p className="-mt-2 ts-ipa-md font-ipa text-ink-secondary" lang="en-fonipa">
              {formatIpaDisplay(chunk.ipa)}
            </p>
          )}
          <p className="mt-3 sm:mt-4 ts-body-lg-strong text-ink">
            {chunk.meaning}
          </p>
        </div>

        <button
          type="button"
          onClick={() => speakText(textToSpeak)}
          aria-label={`Escuchar ${textToSpeak}`}
          className="focus-ring flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink text-paper shadow-xs transition-transform hover:bg-ink/90 active:scale-95"
        >
          <Volume2 size={20} aria-hidden />
        </button>
      </div>

      {/* Example Card */}
      {exampleEn && (
        <div className="pastel-card-inset w-full rounded-2xl p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="font-kicker text-xs uppercase tracking-wider text-ink-secondary">
              EJEMPLO
            </span>
            <button
              type="button"
              onClick={() => speakText(exampleEn)}
              aria-label="Escuchar ejemplo"
              className="focus-ring flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-ink/10 text-ink transition-colors hover:bg-ink/20 active:scale-95"
            >
              <Volume2 size={14} aria-hidden />
            </button>
          </div>
          <p className="ts-body-lg text-ink" lang="en">
            {exampleEn}
          </p>
          {exampleEs && (
            <p className="mt-1 ts-body-translation">
              {exampleEs}
            </p>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      <Link
        className="focus-ring mt-2 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 ts-button text-paper transition-transform hover:bg-ink/90 active:scale-[0.98]"
        href={`/practice/chunks?chunk=${encodeURIComponent(chunk.id)}`}
      >
        <span>Aprender esta expresión</span>
        <ArrowRight size={16} aria-hidden />
      </Link>
    </PastelCard>
  )
}

