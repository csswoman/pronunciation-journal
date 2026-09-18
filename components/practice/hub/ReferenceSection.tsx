'use client'

// Planned structure:
// <ReferenceSection> — "Diccionario" dark surface card
//   Header (Level 1 kicker "CONSULTA", title, description)
//   Search Affordance (Interactive look search bar link to /words)
//   Quick Links (Chunks en contexto, Palabras guardadas)
// </ReferenceSection>

import Link from 'next/link'
import { Search, ArrowRight, BookOpen, Layers } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'

export default function ReferenceSection() {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-fg leading-tight">Diccionario</h2>
          <p className="font-sans text-body-sm text-fg-muted text-pretty">
            Significados, IPA y pistas en todo el catálogo.
          </p>
        </div>

        {/* Search Bar Affordance */}
        <Link
          href="/words"
          onClick={() => void setLastPracticeMode('dictionary')}
          className="group/search focus-ring rounded-2xl block"
        >
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-border-default bg-surface-sunken px-4 py-3 text-body-sm text-fg-muted transition-all duration-150 group-hover/search:border-border-strong group-hover/search:bg-surface-sunken/80">
            <div className="flex items-center gap-2.5">
              <Search
                size={16}
                className="text-fg-subtle group-hover/search:text-primary transition-colors"
                aria-hidden="true"
              />
              <span className="font-sans text-body-sm text-fg-muted group-hover/search:text-fg transition-colors">
                Busca una palabra...
              </span>
            </div>
            <ArrowRight
              size={14}
              className="text-fg-subtle transition-transform duration-200 group-hover/search:translate-x-0.5 group-hover/search:text-fg"
              aria-hidden="true"
            />
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle/60">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Accesos rápidos
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/practice/chunks"
            className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-sunken/50 px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
          >
            <Layers size={14} className="text-fg-subtle shrink-0" aria-hidden="true" />
            <span className="truncate">Chunks</span>
          </Link>
          <Link
            href="/words"
            className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-sunken/50 px-3 py-2 text-caption font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
          >
            <BookOpen size={14} className="text-fg-subtle shrink-0" aria-hidden="true" />
            <span className="truncate">Guardadas</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

