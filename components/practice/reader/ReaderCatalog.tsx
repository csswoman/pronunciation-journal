'use client'

// Planned structure:
// <ReaderCatalog>
//   <PageHeader> (Title with Bricolage font, Kicker, Navigation, Stats Badges) </PageHeader>
//   <HeroGeneratorBanner> (PastelCard tone="lilac", Aa circle, target words, CTA) </HeroGeneratorBanner>
//   <FiltersAndSearchBar> (Pill tabs: Todas, A1..B2; Pill search input) </FiltersAndSearchBar>
//   <PassageGrid>
//     <ReaderCard /> (with rotating pastel tones)
//   </PassageGrid>
//   <EmptyState /> (when no matches found)
// </ReaderCatalog>

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { ReaderCard } from './ReaderCard'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { BookOpen, Sparkles, Search, ArrowLeft } from '@/components/icons'

interface ReaderCatalogProps {
  passages: ReaderPassage[]
  previewWords?: string[]
  onSelectPassage: (passage: ReaderPassage) => void
  onDeletePassage?: (passage: ReaderPassage) => void
  onGenerateNew: () => void
  isGenerating: boolean
  online: boolean
}

const LEVEL_FILTERS = ['Todas', 'A1', 'A2', 'B1', 'B2'] as const
const PASTEL_TONES: PastelTone[] = ['sky', 'butter', 'mint', 'coral', 'lilac']

export function ReaderCatalog({
  passages,
  previewWords = ['would', 'about', 'which', 'there', 'know'],
  onSelectPassage,
  onDeletePassage,
  onGenerateNew,
  isGenerating,
  online,
}: ReaderCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('Todas')
  const [searchQuery, setSearchQuery] = useState('')

  const activeWords = previewWords.length > 0 ? previewWords : ['would', 'about', 'which', 'there', 'know']

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      const matchesLevel =
        selectedLevel === 'Todas' ||
        selectedLevel === 'TODOS' ||
        p.level.toLowerCase() === selectedLevel.toLowerCase()

      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.topic.toLowerCase().includes(query) ||
        p.passage.toLowerCase().includes(query) ||
        p.targetItems.some((w) => w.toLowerCase().includes(query))

      return matchesLevel && matchesSearch
    })
  }, [passages, selectedLevel, searchQuery])

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Top Bar Navigation & Main Page Header */}
      <div className="flex flex-col gap-4">
        <div>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-fg-muted transition-colors hover:text-fg focus-ring rounded py-1"
          >
            <ArrowLeft className="size-4" />
            <span>Volver al Hub de Práctica</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-fg-muted block">
              INPUT COMPRENSIBLE
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-fg tracking-tight mt-1">
              Lectura guiada
            </h1>
            <p className="text-body-md text-fg-muted mt-1 max-w-xl">
              Historias a tu nivel con las palabras que estás aprendiendo.
            </p>
          </div>

          {/* Stats Badges Top Right */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <span className="rounded-full bg-surface-raised border border-border px-4 py-1.5 text-xs font-semibold text-fg-muted shadow-2xs">
              {passages.length} {passages.length === 1 ? 'historia guardada' : 'historias guardadas'}
            </span>
            <span className="rounded-full bg-[var(--mint-soft)] border border-[var(--mint-deep)]/40 px-4 py-1.5 text-xs font-bold text-fg shadow-2xs">
              14 palabras leídas en contexto
            </span>
          </div>
        </div>
      </div>

      {/* Hero Action Banner Lila */}
      <PastelCard
        tone="lilac"
        className="relative overflow-hidden rounded-3xl p-6 sm:p-7 shadow-xs border border-black/10"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5 max-w-3xl">
            <div className="size-16 sm:size-20 rounded-full bg-paper/50 backdrop-blur-xs border border-fg/20 flex items-center justify-center shrink-0 shadow-2xs font-display font-black text-2xl sm:text-3xl text-fg">
              Aa
            </div>

            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-fg/70">
                NUEVA LECTURA
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-black text-fg leading-tight">
                Crea una historia a tu medida
              </h2>
              <p className="text-body-sm text-fg/80 max-w-xl leading-relaxed">
                Elige nivel y tema. La IA escribe la historia con tus palabras de hoy y le pone voz native.
              </p>

              {/* Target Words Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-1">
                <span className="text-xs font-bold text-fg/75 mr-1">Hoy entran:</span>
                {activeWords.slice(0, 5).map((word) => (
                  <span
                    key={word}
                    className="inline-flex items-center rounded-full bg-paper/90 backdrop-blur-xs px-3 py-1 text-xs font-mono font-medium text-fg border border-black/10 shadow-2xs"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onGenerateNew}
            disabled={!online || isGenerating}
            className="w-full md:w-auto rounded-full bg-ink text-paper hover:bg-ink-secondary disabled:opacity-50 px-6 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm shrink-0"
          >
            <Sparkles className="size-4" />
            <span>{isGenerating ? 'Generando lectura...' : 'Nueva historia ✨'}</span>
          </button>
        </div>
      </PastelCard>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Level Filters Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {LEVEL_FILTERS.map((lvl) => {
            const isActive = selectedLevel === lvl || (lvl === 'Todas' && selectedLevel === 'TODOS')
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-xs'
                    : 'bg-surface-raised border border-border/60 text-fg-muted hover:text-fg hover:bg-surface-sunken'
                }`}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        {/* Search Input Pill */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por tema o palabra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-border bg-surface px-4 py-2 pl-10 text-sm text-fg placeholder:text-fg-muted focus-ring shadow-2xs transition-colors"
          />
        </div>
      </div>

      {/* Grid of Stories */}
      {filteredPassages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPassages.map((passage, idx) => (
            <ReaderCard
              key={passage.id}
              passage={passage}
              tone={PASTEL_TONES[idx % PASTEL_TONES.length]}
              onSelect={onSelectPassage}
              onDelete={onDeletePassage}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/80 p-12 text-center bg-surface-sunken/30">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-surface-raised text-fg-muted shadow-2xs">
            <BookOpen className="size-7" />
          </div>
          <h3 className="font-display text-xl font-bold text-fg">
            {passages.length === 0
              ? 'Aún no tienes historias en tu biblioteca'
              : 'No se encontraron historias con este filtro'}
          </h3>
          <p className="text-body-sm text-fg-muted max-w-sm">
            {passages.length === 0
              ? 'Pulsa el botón superior para generar tu primera lectura personalizada con voz native.'
              : 'Intenta cambiar el nivel o buscar otro término.'}
          </p>
          {passages.length === 0 && (
            <button
              type="button"
              onClick={onGenerateNew}
              disabled={!online || isGenerating}
              className="mt-2 rounded-full bg-ink text-paper hover:bg-ink-secondary px-5 py-2.5 text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <Sparkles className="size-4" />
              <span>Generar mi primera historia</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
