'use client'

// Planned structure:
// <ReaderCatalog>
//   <HeroGeneratorBanner />
//   <CatalogFiltersAndSearch />
//   <PassageGrid>
//     <ReaderCard /> (for each passage)
//   </PassageGrid>
//   <EmptyState /> (when no passages match)
// </ReaderCatalog>

import { useState, useMemo } from 'react'
import type { ReaderPassage } from '@/lib/practice/reader/types'
import { ReaderCard } from './ReaderCard'
import Button from '@/components/ui/Button'
import { BookOpen, Sparkles, Search } from '@/components/icons'

interface ReaderCatalogProps {
  passages: ReaderPassage[]
  onSelectPassage: (passage: ReaderPassage) => void
  onDeletePassage?: (passage: ReaderPassage) => void
  onGenerateNew: () => void
  isGenerating: boolean
  online: boolean
}

const LEVEL_FILTERS = ['TODOS', 'A1', 'A2', 'B1', 'B2'] as const

export function ReaderCatalog({
  passages,
  onSelectPassage,
  onDeletePassage,
  onGenerateNew,
  isGenerating,
  online,
}: ReaderCatalogProps) {
  const [selectedLevel, setSelectedLevel] = useState<string>('TODOS')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      const matchesLevel =
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
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
      {/* Hero Action Card */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-surface-raised via-surface-raised to-primary-soft/30 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="font-kicker text-caption uppercase tracking-wider text-primary">
                Input Comprensible
              </span>
              <span className="text-caption font-mono text-fg-muted">
                · {passages.length} {passages.length === 1 ? 'historia guardada' : 'historias guardadas'}
              </span>
            </div>
            <h2 className="text-h2 text-fg">Crea una lectura personalizada</h2>
            <p className="text-body text-fg-muted leading-relaxed">
              Genera historias cautivadoras adaptadas a tu nivel, con locución nativa de Gemini y las palabras clave que necesitas practicar hoy.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={onGenerateNew}
            disabled={!online || isGenerating}
            className="w-full sm:w-auto font-medium shrink-0 shadow-sm"
          >
            <Sparkles className="size-4" />
            <span>{isGenerating ? 'Generando lectura...' : 'Nueva historia ✨'}</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-border-default pb-4">
        {/* Level Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {LEVEL_FILTERS.map((lvl) => {
            const isActive = selectedLevel === lvl
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`rounded-full px-3 py-1 text-caption font-mono font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-fg shadow-xs'
                    : 'bg-surface-sunken text-fg-muted hover:text-fg hover:bg-surface-raised'
                }`}
              >
                {lvl}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por tema o palabra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border-default bg-surface-raised pl-9 pr-3 py-1.5 text-body-sm text-fg placeholder:text-fg-muted focus-ring transition-colors"
          />
        </div>
      </div>

      {/* Grid of Stories */}
      {filteredPassages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPassages.map((passage) => (
            <ReaderCard
              key={passage.id}
              passage={passage}
              onSelect={onSelectPassage}
              onDelete={onDeletePassage}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border-default p-12 text-center bg-surface-sunken/40">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-surface-raised text-fg-muted shadow-xs">
            <BookOpen className="size-6" />
          </div>
          <h3 className="text-body-lg font-medium text-fg">
            {passages.length === 0
              ? 'Aún no tienes historias en tu biblioteca'
              : 'No se encontraron historias con este filtro'}
          </h3>
          <p className="text-body-sm text-fg-muted max-w-sm">
            {passages.length === 0
              ? 'Pulsa el botón superior para generar tu primera lectura con audio HD y práctica guiada.'
              : 'Intenta cambiar el nivel o buscar otro término.'}
          </p>
          {passages.length === 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onGenerateNew}
              disabled={!online || isGenerating}
              className="mt-2 font-medium"
            >
              <Sparkles className="size-4 text-primary" />
              <span>Generar mi primera historia</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
