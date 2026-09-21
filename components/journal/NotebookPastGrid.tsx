'use client'

// Planned structure:
// <NotebookPastGrid>
//   <SectionHeader: "Páginas anteriores" + page count badge />
//   <RowsList:
//     {pastPages.map => <PastPageRow mintDateBox previewText meta badge arrowRight />}
//   </RowsList>
//   <FooterDashedInfoNote: "+ Cada página que escribas se guarda aquí..." />
// </NotebookPastGrid>

import Link from 'next/link'
import { ArrowRight, Plus } from '@/components/icons'
import type { NotebookHome } from '@/lib/journal/notebook-types'

interface NotebookPastGridProps {
  pastPages: NotebookHome['pastPages']
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
    return { month: 'PÁG', day: '1' }
  }
}

export function NotebookPastGrid({ pastPages }: NotebookPastGridProps) {
  if (pastPages.length === 0) return null

  return (
    <section aria-labelledby="past-pages-heading" className="flex flex-col gap-4">
      {/* Header con título y contador */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h2
            id="past-pages-heading"
            className="font-heading text-h2 font-extrabold text-fg"
          >
            Páginas anteriores
          </h2>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-raised px-2.5 py-0.5 font-sans text-caption font-medium text-fg-muted select-none">
            {pastPages.length} {pastPages.length === 1 ? 'página' : 'páginas'}
          </span>
        </div>

      </div>

      {/* Lista de páginas anteriores */}
      <div className="flex flex-col gap-3">
        {pastPages.map((page) => {
          const entryDateKey = page.entryDate || page.date
          const { month, day } = parseDateParts(entryDateKey)
          const errorCount = page.errorCount ?? 0
          const metaText = page.sentences
            ? `${page.sentences * 10 || 45} palabras · ${errorCount} ${errorCount === 1 ? 'corrección' : 'correcciones'}`
            : 'Entrada guardada'

          return (
            <Link
              key={page.id}
              href={`/journal/${entryDateKey}`}
              aria-label={`Página del ${entryDateKey}: ${page.firstLine}`}
              className="focus-ring group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-border-default bg-surface-raised p-4 transition-all hover:border-border-strong hover:bg-surface-sunken/50 shadow-2xs"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Bloque de fecha MINT */}
                <div className="flex flex-col items-center justify-center rounded-xl bg-mint text-ink px-3 py-1.5 shrink-0 w-12 text-center select-none shadow-2xs">
                  <span className="font-mono text-[10px] font-bold tracking-wider uppercase opacity-80 leading-none">
                    {month}
                  </span>
                  <span className="font-heading text-body-md font-extrabold leading-tight">
                    {day}
                  </span>
                </div>

                {/* Previsualización del texto y métricas */}
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                  <p className="font-heading text-body-sm font-bold text-fg truncate">
                    {page.firstLine}
                  </p>
                  <span className="font-sans text-caption text-fg-muted">
                    {metaText}
                  </span>
                </div>
              </div>

              {/* Badge de estado + Flecha */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {page.status === 'reviewed' ? (
                  <span className="inline-flex items-center rounded-full bg-mint px-3 py-1 font-sans text-caption font-bold text-ink select-none">
                    revisada
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-butter px-3 py-1 font-sans text-caption font-bold text-ink select-none">
                    Sin revisar
                  </span>
                )}
                <ArrowRight
                  size={16}
                  className="text-fg-muted transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
                  aria-hidden
                />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Cuadro informativo inferior con borde punteado */}
      <div className="flex items-center gap-2.5 rounded-2xl border border-dashed border-border-subtle bg-transparent p-4 font-sans text-caption text-fg-muted select-none">
        <Plus size={16} className="shrink-0 text-fg-muted" aria-hidden />
        <span>Cada página que escribas se guarda aquí con sus correcciones.</span>
      </div>
    </section>
  )
}
