'use client'

// Planned structure:
// <JournalPronunciationCard>
//   <LeftIllustration: amber language-phrase-book SVG />
//   <MiddleContent: title, description, saved words chips />
//   <RightAction: "+ Añadir palabra" button (opens modal or link) />
// </JournalPronunciationCard>

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { getIllustration } from '@/lib/illustrations/registry'

const LanguageBookIllustration = getIllustration('journalLanguageBook')

interface JournalPronunciationCardProps {
  savedWords?: string[]
  onAddWord?: () => void
}

const DEFAULT_SAMPLE_WORDS = ['thoroughly', 'clothes', 'world', 'schedule']

export function JournalPronunciationCard({
  savedWords = [],
  onAddWord,
}: JournalPronunciationCardProps) {
  const displayWords = savedWords.length > 0 ? savedWords : DEFAULT_SAMPLE_WORDS
  const visibleWords = displayWords.slice(0, 3)
  const remainingCount = displayWords.length - visibleWords.length

  return (
    <section
      aria-labelledby="pronunciation-card-heading"
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-4 sm:items-center">
        {/* Ilustración ámbar / accent */}
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary [&>svg]:h-10 [&>svg]:w-auto"
          aria-hidden="true"
        >
          <LanguageBookIllustration />
        </div>

        <div className="flex flex-col gap-1.5">
          <h2
            id="pronunciation-card-heading"
            className="font-h4 font-medium text-fg"
          >
            Diario de pronunciación
          </h2>
          <p className="font-body-sm text-fg-muted max-w-xl">
            Guarda las palabras que se te traban al hablar y vuelve a ellas cuando practiques.
          </p>

          {/* Chips de palabras guardadas */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {visibleWords.map((word) => (
              <span
                key={word}
                className="rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-mono text-xs font-medium text-fg"
              >
                {word}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="font-caption text-fg-muted">
                +{remainingCount} más
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-start sm:self-center">
        {onAddWord ? (
          <Button variant="secondary" size="sm" onClick={onAddWord}>
            + Añadir palabra
          </Button>
        ) : (
          <Link href="/journal/write?mode=pronunciation">
            <Button variant="secondary" size="sm">
              + Añadir palabra
            </Button>
          </Link>
        )}
      </div>
    </section>
  )
}
