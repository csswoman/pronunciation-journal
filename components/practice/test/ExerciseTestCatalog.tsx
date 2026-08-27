'use client'

// Planned structure:
// <ExerciseTestCatalog>
//   <CatalogHeader />
//   <CatalogToolbar>
//     <SearchInput />
//     <DomainTabs />
//     <QuickActions />
//   </CatalogToolbar>
//   <CatalogSections>
//     <DomainSection>
//       <ExerciseGrid>
//         <ExerciseCard />
//       </ExerciseGrid>
//     </DomainSection>
//   </CatalogSections>
// </ExerciseTestCatalog>

import { useMemo, useState } from 'react'
import { Layers, Search, Sparkles, X } from '@/components/icons'
import { ExerciseCard } from '@/components/practice/test/ExerciseCard'
import { DOMAIN_LABELS } from '@/components/practice/test/constants'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import type { TestGalleryDomain, TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'

interface Props {
  grouped: { domain: TestGalleryDomain; items: TestGalleryEntry[] }[]
  activeEntryId: string | null
  canSplit: boolean
  onSelect: (entry: TestGalleryEntry, mode: 'single' | 'split') => void
  onLaunchAll: () => void
  onOpenEssentialWords: () => void
}

type TabFilter = 'all' | TestGalleryDomain

export function ExerciseTestCatalog({
  grouped,
  activeEntryId,
  canSplit,
  onSelect,
  onLaunchAll,
  onOpenEssentialWords,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabFilter>('all')

  const totalCount = useMemo(
    () => grouped.reduce((acc, group) => acc + group.items.length, 0),
    [grouped],
  )

  const filteredGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return grouped
      .filter((group) => activeTab === 'all' || group.domain === activeTab)
      .map((group) => ({
        domain: group.domain,
        items: group.items.filter(
          (item) =>
            !query ||
            item.label.toLowerCase().includes(query) ||
            item.slug.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [grouped, activeTab, searchQuery])

  const totalFilteredCount = useMemo(
    () => filteredGroups.reduce((acc, group) => acc + group.items.length, 0),
    [filteredGroups],
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="font-kicker text-fg-subtle">Entorno de desarrollo</span>
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 font-mono text-tiny font-semibold text-primary">
            {totalCount} ejercicios
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-h2 font-bold text-fg">Catálogo de Ejercicios</h1>
            <p className="text-body-sm text-fg-muted mt-1">
              Explora, prueba y valida cada variante pedagógica de forma aislada o comparada.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={onOpenEssentialWords}
            >
              Palabras esenciales
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Layers size={14} />}
              onClick={onLaunchAll}
            >
              Recorrer todos
            </Button>
          </div>
        </div>
      </header>

      {/* Toolbar: Search & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised p-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o slug (ej. dictado, shadow, minimal)..."
            className="focus-ring w-full rounded-md border border-border-default bg-surface-base py-2 pl-9 pr-8 text-body-sm text-fg placeholder:text-fg-subtle transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
              aria-label="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {/* Domain Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'focus-ring shrink-0 rounded-md px-3 py-1.5 font-label text-caption font-medium transition-colors',
              activeTab === 'all'
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
            )}
          >
            Todos ({totalCount})
          </button>
          {grouped.map(({ domain, items }) => (
            <button
              key={domain}
              type="button"
              onClick={() => setActiveTab(domain)}
              className={cn(
                'focus-ring shrink-0 rounded-md px-3 py-1.5 font-label text-caption font-medium transition-colors',
                activeTab === domain
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )}
            >
              {DOMAIN_LABELS[domain]} ({items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Exercises */}
      {totalFilteredCount === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-raised p-12 text-center">
          <Search size={28} className="text-fg-subtle mb-3" aria-hidden />
          <h2 className="text-body-md font-semibold text-fg">No se encontraron ejercicios</h2>
          <p className="text-body-sm text-fg-muted mt-1 max-w-sm">
            No hay ningún tipo de ejercicio que coincida con &ldquo;{searchQuery}&rdquo;.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery('')
              setActiveTab('all')
            }}
            className="mt-4"
          >
            Restablecer filtros
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredGroups.map(({ domain, items }) => (
            <section key={domain} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
                <h2 className="text-h4 font-bold text-fg">{DOMAIN_LABELS[domain]}</h2>
                <span className="font-mono text-tiny text-fg-subtle">
                  ({items.length} {items.length === 1 ? 'ejercicio' : 'ejercicios'})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {items.map((entry) => (
                  <ExerciseCard
                    key={entry.id}
                    entry={entry}
                    active={entry.id === activeEntryId}
                    canSplit={canSplit}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
