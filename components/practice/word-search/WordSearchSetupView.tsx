'use client'

// Planned structure:
// <WordSearchSetupView>
//   <BackLink />
//   <SetupCardContainer>
//     <PageHeader />
//     <Divider />
//     <WordSearchSetup />
//   </SetupCardContainer>
// </WordSearchSetupView>

import Link from 'next/link'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import PageHeader from '@/components/layout/PageHeader'
import { ArrowLeft } from '@/components/icons'
import WordSearchSetup from './WordSearchSetup'

interface Props {
  onStartPuzzle: (puzzle: WordSearchPuzzle) => void
}

export default function WordSearchSetupView({ onStartPuzzle }: Props) {
  return (
    <div
      id="word-search-setup"
      className="mx-auto flex w-full max-w-[var(--layout-session-max)] flex-col gap-4"
    >
      <Link
        href="/practice"
        className="focus-ring inline-flex min-h-11 w-fit items-center gap-1.5 rounded-sm text-caption text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        <span>Volver a Práctica</span>
      </Link>

      <div className="flex flex-col gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs sm:p-7">
        <PageHeader
          kicker="Práctica de vocabulario"
          title="Sopa de letras"
          subtitle="Encuentra las palabras en el tablero, entrena ortografía visual y escucha su pronunciación nativa."
        />
        <hr className="border-border-subtle/80" />
        <WordSearchSetup onStartPuzzle={onStartPuzzle} />
      </div>
    </div>
  )
}
