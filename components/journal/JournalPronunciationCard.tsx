'use client'

// Planned structure:
// <JournalPronunciationCard>
//   <LeftGroup>
//     <MicrophoneIconCircle />
//     <CopyAndWordChips>
//       <TitleAndSubtitle />
//       <IPASavedWordPills />
//     </CopyAndWordChips>
//   </LeftGroup>
//   <RightCTA: "+ Añadir palabra" dark ink pill button />
// </JournalPronunciationCard>

import Link from 'next/link'
import { Mic } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'

interface JournalPronunciationCardProps {
  savedWords?: string[]
  onAddWord?: () => void
}

const DEFAULT_SAMPLE_WORDS: Array<{ word: string; ipa: string }> = [
  { word: 'thoroughly', ipa: '/ˈθʌrəli/' },
  { word: 'clothes', ipa: '/kloʊðz/' },
  { word: 'world', ipa: '/wɜːrld/' },
]

const SAMPLE_IPA_MAP: Record<string, string> = {
  thoroughly: '/ˈθʌrəli/',
  clothes: '/kloʊðz/',
  world: '/wɜːrld/',
  schedule: '/ˈskɛdʒuːl/',
}

export function JournalPronunciationCard({
  savedWords = [],
  onAddWord,
}: JournalPronunciationCardProps) {
  const isDefault = savedWords.length === 0
  const rawWords = isDefault ? DEFAULT_SAMPLE_WORDS.map((item) => item.word) : savedWords
  const visibleWords = rawWords.slice(0, 3)
  const remainingCount = rawWords.length - visibleWords.length

  const buttonContent = (
    <button
      type="button"
      onClick={onAddWord}
      className="press-feedback focus-ring inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 font-label text-body-sm font-bold text-paper transition-all hover:bg-ink-secondary shadow-sm select-none cursor-pointer"
    >
      + Añadir palabra
    </button>
  )

  return (
    <PastelCard
      tone="coral"
      className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between overflow-hidden motion-reduce:shadow-none"
      aria-labelledby="pronunciation-card-heading"
    >
      <div className="flex items-start gap-4 sm:items-center min-w-0">
        {/* Ícono de micrófono en círculo */}
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink shadow-xs"
          aria-hidden="true"
        >
          <Mic className="size-6 text-ink" aria-hidden />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <h2
            id="pronunciation-card-heading"
            className="font-heading text-h3 font-bold text-ink leading-tight"
          >
            Diario de pronunciación
          </h2>
          <p className="font-sans text-body-sm text-ink-secondary max-w-xl">
            Palabras que se te traban al hablar. Vuelve a ellas cuando practiques.
          </p>

          {/* Chips de palabras guardadas con IPA */}
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {visibleWords.map((word) => {
              const ipa = SAMPLE_IPA_MAP[word.toLowerCase()]
              return (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-3 py-1 font-sans text-caption font-semibold text-ink shadow-2xs select-none"
                >
                  <span className="font-bold text-ink">{word}</span>
                  {ipa ? (
                    <span className="font-ipa font-normal text-ink-secondary">{ipa}</span>
                  ) : null}
                </span>
              )
            })}
            {remainingCount > 0 && (
              <span className="font-sans text-caption font-semibold text-ink-secondary select-none">
                +{remainingCount} más
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-start sm:self-center pt-1 sm:pt-0">
        {onAddWord ? (
          buttonContent
        ) : (
          <Link href="/journal/write?mode=pronunciation">
            {buttonContent}
          </Link>
        )}
      </div>
    </PastelCard>
  )
}
