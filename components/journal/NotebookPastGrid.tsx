'use client'

// Planned structure:
// <NotebookPastGrid>
//   <SectionHeader: "Páginas anteriores" + "Ver todas" link />
//   <RowsList:
//     {pastPages.map => <PastPageRow date firstLine badge />}
//   </RowsList>
// </NotebookPastGrid>

import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { NotebookHome } from '@/lib/journal/notebook-types'

interface NotebookPastGridProps {
  pastPages: NotebookHome['pastPages']
}

export function NotebookPastGrid({ pastPages }: NotebookPastGridProps) {
  if (pastPages.length === 0) return null

  return (
    <section aria-labelledby="past-pages-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3
          id="past-pages-heading"
          className="font-h4 font-medium text-fg"
        >
          Páginas anteriores
        </h3>
        {pastPages.length > 5 && (
          <Link
            href="/journal/history"
            className="font-caption font-medium text-fg-muted hover:text-fg"
          >
            Ver todas
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {pastPages.map((page) => {
          const entryDateKey = page.entryDate || page.date
          const dateLabel = page.displayDate || page.date
          const isReviewed = page.status === 'reviewed' || page.errorCount !== undefined

          return (
            <Link
              key={page.id}
              href={`/journal/${entryDateKey}`}
              aria-label={`Página del ${dateLabel}: ${page.firstLine}`}
              className="focus-ring group flex flex-col gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 items-baseline gap-4 min-w-0">
                <time className="w-16 shrink-0 font-caption font-medium text-fg-muted">
                  {dateLabel}
                </time>
                <p className="line-clamp-1 flex-1 font-serif font-body-sm text-fg">
                  {page.firstLine}
                </p>
              </div>

              <div className="shrink-0 self-end sm:self-center">
                {isReviewed ? (
                  <Badge
                    label={
                      page.errorCount && page.errorCount > 0
                        ? `Revisada · ${page.errorCount} ${page.errorCount === 1 ? 'corrección' : 'correcciones'}`
                        : 'Revisada · Sin errores'
                    }
                    variant="success"
                    size="sm"
                  />
                ) : (
                  <Badge label="Sin revisar" variant="warning" size="sm" />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
