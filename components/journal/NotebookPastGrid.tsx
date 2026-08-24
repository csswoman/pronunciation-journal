'use client'

// Planned structure:
// <NotebookPastGrid>
//   <SectionLabel />
//   <CardGrid>
//     {pastPages.map => <PastPageCard />}
//   </CardGrid>
// </NotebookPastGrid>

import Link from 'next/link'
import type { NotebookHome } from '@/lib/journal/notebook-types'

interface NotebookPastGridProps {
  pastPages: NotebookHome['pastPages']
}

export function NotebookPastGrid({ pastPages }: NotebookPastGridProps) {
  if (pastPages.length === 0) return null

  return (
    <section aria-labelledby="past-pages-heading" className="flex flex-col gap-2.5">
      <h3
        id="past-pages-heading"
        className="font-caption font-medium text-fg-muted"
      >
        Páginas anteriores
      </h3>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2.5">
        {pastPages.map((page) => {
          const entryDateKey = page.entryDate || page.date
          const dateLabel = page.displayDate || page.date

          return (
            <Link
              key={page.id}
              href={`/journal/${entryDateKey}`}
              aria-label={`Página del ${dateLabel}: ${page.firstLine}`}
              className="focus-ring group flex flex-col justify-between gap-3 rounded-[var(--radius-sm)] bg-surface-sunken p-3.5 text-left transition-colors hover:bg-surface-sunken/80"
            >
              <div className="flex flex-col gap-1.5">
                <time className="font-tiny font-medium text-fg-muted">
                  {dateLabel}
                </time>
                <p className="line-clamp-2 font-serif font-body-sm leading-snug text-fg">
                  {page.firstLine}
                </p>
              </div>

              <p className="font-tiny text-fg-muted">
                {page.sentences} {page.sentences === 1 ? 'frase' : 'frases'} ·{' '}
                {page.newWords} {page.newWords === 1 ? 'palabra nueva' : 'palabras nuevas'}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
