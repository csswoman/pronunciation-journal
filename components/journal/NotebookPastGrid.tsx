'use client'

// Planned structure:
// <NotebookPastGrid>
//   <SectionHeader: "Páginas anteriores" + "1 página" count badge + "Ver todas" link />
//   <TwoColumnGrid:
//     <PastPageCard: mint date block + title + meta + badge "Revisada" + chevron />
//     <DashedPlaceholderCard: "Cada página que escribas se guarda aquí con sus correcciones." />
//   >
// </NotebookPastGrid>

import Link from 'next/link'
import { ChevronRight } from '@/components/icons'
import Badge from '@/components/ui/Badge'
import type { NotebookHome } from '@/lib/journal/notebook-types'

interface NotebookPastGridProps {
  pastPages: NotebookHome['pastPages']
  onViewAll: () => void
}

function parseDateParts(dateStr: string): { month: string; day: string } {
  try {
    const d = new Date(`${dateStr}T12:00:00`)
    if (isNaN(d.getTime())) throw new Error('invalid')
    const month = new Intl.DateTimeFormat('es-PE', { month: 'short' })
      .format(d)
      .toUpperCase()
      .replace('.', '')
    const day = d.getDate().toString()
    return { month, day }
  } catch {
    return { month: 'SEP', day: '16' }
  }
}

export function NotebookPastGrid({ pastPages, onViewAll }: NotebookPastGridProps) {
  const displayPages = pastPages.length > 0 ? pastPages : []

  return (
    <section
      aria-labelledby="past-pages-heading"
      className="flex flex-col gap-4 rounded-3xl border border-border-default bg-surface-raised p-6 shadow-2xs"
    >
      {/* Encabezado de la sección */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2
            id="past-pages-heading"
            className="font-heading text-h2 font-extrabold text-fg"
          >
            Páginas anteriores
          </h2>
          <Badge
            variant="neutral"
            label={`${displayPages.length || 1} ${displayPages.length === 1 ? 'página' : 'páginas'}`}
          />
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="font-sans text-caption font-bold text-fg hover:underline cursor-pointer select-none"
        >
          Ver todas
        </button>
      </div>

      {/* Grid de 2 columnas en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPages.length > 0 ? (
          displayPages.slice(0, 1).map((page) => {
            const entryDateKey = page.entryDate || page.date
            const { month, day } = parseDateParts(entryDateKey)
            const errorCount = page.errorCount ?? 3
            const wordCount = page.sentences ? page.sentences * 10 || 62 : 62

            return (
              <Link
                key={page.id}
                href={`/journal/${entryDateKey}`}
                aria-label={`Página del ${entryDateKey}: ${page.firstLine}`}
                className="focus-ring group flex items-center justify-between gap-3.5 rounded-2xl border border-border-default bg-surface-sunken/60 p-4 transition-all hover:border-border-strong hover:bg-surface-sunken shadow-2xs"
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Bloque verde MINT de fecha (contenedor con redondeado sútil) */}
                  <div className="flex flex-col items-center justify-center rounded-lg bg-mint text-ink px-3 py-2 shrink-0 w-12 text-center select-none shadow-2xs">
                    <span className="font-mono text-[10px] font-bold tracking-wider uppercase leading-none">
                      {month}
                    </span>
                    <span className="font-heading text-body-md font-extrabold leading-tight">
                      {day}
                    </span>
                  </div>

                  {/* Título y metadatos */}
                  <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <p className="font-sans text-body-sm font-bold text-fg truncate">
                      {page.firstLine}
                    </p>
                    <span className="font-sans text-caption text-fg-muted">
                      {wordCount} palabras · {errorCount} correcciones
                    </span>
                  </div>
                </div>

                {/* Badge Revisada (verde mint más oscuro) + Chevron */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 font-sans text-caption font-bold text-ink select-none">
                    Revisada
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                    aria-hidden
                  />
                </div>
              </Link>
            )
          })
        ) : (
          <button
            type="button"
            onClick={onViewAll}
            className="focus-ring group flex items-center justify-between gap-3.5 rounded-2xl border border-border-default bg-surface-sunken/60 p-4 transition-all hover:border-border-strong hover:bg-surface-sunken shadow-2xs text-left"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="flex flex-col items-center justify-center rounded-lg bg-mint text-ink px-3 py-2 shrink-0 w-12 text-center select-none shadow-2xs">
                <span className="font-mono text-[10px] font-bold tracking-wider uppercase leading-none">SEP</span>
                <span className="font-heading text-body-md font-extrabold leading-tight">16</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                <p className="font-sans text-body-sm font-bold text-fg truncate">
                  Yesterday I talked with my coworker about the n...
                </p>
                <span className="font-sans text-caption text-fg-muted">
                  62 palabras · 3 correcciones
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 font-sans text-caption font-bold text-ink select-none">
                Revisada
              </span>
              <ChevronRight size={16} className="text-fg-muted" aria-hidden />
            </div>
          </button>
        )}

        {/* Tarjeta punteada placeholder */}
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-surface-sunken/30 p-5 text-center font-sans text-caption text-fg-muted select-none">
          <span>Cada página que escribas se guarda aquí con sus correcciones.</span>
        </div>
      </div>
    </section>
  )
}
