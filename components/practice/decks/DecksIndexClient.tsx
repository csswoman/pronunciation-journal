'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  BookOpen, Search, Code2, Briefcase, Headphones, Sparkles, ShoppingBag,
  Plane, Utensils, MessageCircle, Languages, Timer, GitCompareArrows, Layers, Lightbulb,
} from '@/components/icons'
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { ListPagination } from '@/components/ui/ListPagination'
import type { DeckSummary, DeckLevel } from '@/lib/courses/grammar-deck/decks'

interface Props {
  decks: DeckSummary[]
}

const PAGE_SIZE_DESKTOP = 16
const PAGE_SIZE_MOBILE = 8

const LEVEL_SCALE: { id: DeckLevel | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'a1', label: 'A1' },
  { id: 'a2', label: 'A2' },
  { id: 'b1', label: 'B1' },
  { id: 'b2', label: 'B2' },
  { id: 'c1', label: 'C1' },
]

const TOPIC_GROUPS: { id: DeckLevel; label: string }[] = [
  { id: 'tech', label: 'Tech' },
  { id: 'biz', label: 'Business' },
  { id: 'cs', label: 'Connected Speech' },
  { id: 'chunks', label: 'Chunks' },
  { id: 'false-friends', label: 'Falsos Cognados' },
]

const ICON_MAP: Record<string, typeof BookOpen> = {
  code: Code2, briefcase: Briefcase, 'shopping-bag': ShoppingBag, plane: Plane, utensils: Utensils,
  headphones: Headphones, message: MessageCircle, sparkles: Sparkles, languages: Languages,
  timer: Timer, 'git-compare': GitCompareArrows, layers: Layers, 'book-open': BookOpen,
}

export function DecksIndexClient({ decks }: Props) {
  const [activeLevel, setActiveLevel] = useState<DeckLevel | 'all'>('all')
  const [activeTopic, setActiveTopic] = useState<DeckLevel | null>(null)
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [layoutReady, setLayoutReady] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const isSmUp = useMediaQuery('(min-width: 640px)')
  const pageSize = layoutReady && !isSmUp ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP

  useEffect(() => { setLayoutReady(true) }, [])

  const deckCounts = useMemo(() => {
    const counts: Record<string, number> = { all: decks.length }
    for (const d of decks) counts[d.level] = (counts[d.level] || 0) + 1
    return counts
  }, [decks])

  const filtered = useMemo(() => {
    let result = decks
    if (activeTopic) result = result.filter((d) => d.level === activeTopic)
    else if (activeLevel !== 'all') result = result.filter((d) => d.level === activeLevel)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter((d) => d.title.toLowerCase().includes(q) || d.shortTitle.toLowerCase().includes(q) || d.sampleWords.some((w) => w.toLowerCase().includes(q)))
    }
    return result
  }, [decks, activeLevel, activeTopic, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = useMemo(() => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filtered, currentPage, pageSize])

  useEffect(() => { setCurrentPage(1) }, [activeLevel, activeTopic, query])
  useEffect(() => { setCurrentPage((page) => Math.min(page, totalPages)) }, [totalPages])

  function handlePageChange(page: number) {
    setCurrentPage(page)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  const isFiltered = activeLevel !== 'all' || activeTopic !== null || query.trim() !== ''

  return (
    <div className="flex flex-col gap-6">
      <FilterToolbar
        activeLevel={activeLevel}
        onLevelChange={(lvl) => { setActiveLevel(lvl); setActiveTopic(null) }}
        activeTopic={activeTopic}
        onTopicChange={(tpc) => { setActiveTopic(activeTopic === tpc ? null : tpc) }}
        query={query}
        onQueryChange={setQuery}
        counts={deckCounts}
      />

      {filtered.length === 0 ? (
        <div className="py-12 text-center rounded-3xl border border-dashed border-border-default bg-surface-sunken p-8">
          <p className="font-heading text-body-lg font-bold text-fg">No encontramos mazos</p>
          <p className="mt-1 text-body-sm text-fg-muted">Prueba cambiar los filtros o el término de búsqueda.</p>
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-6">
          {!isFiltered && currentPage === 1 ? (
            <>
              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-body-md font-bold text-fg">Recomendado para ti</h2>
                <DeckGrid decks={paginated.slice(0, 3)} showLevelBadge={activeLevel === 'all'} featuredFirst />
              </section>
              <section className="flex flex-col gap-3">
                <h2 className="font-heading text-body-md font-bold text-fg border-t border-border-subtle pt-6">Todos los mazos</h2>
                <DeckGrid decks={paginated.slice(3)} showLevelBadge={activeLevel === 'all'} />
              </section>
            </>
          ) : (
            <DeckGrid decks={paginated} showLevelBadge={!isFiltered} />
          )}
          <ListPagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={handlePageChange} ariaLabel="Paginación de mazos" />
        </div>
      )}
    </div>
  )
}

function FilterToolbar({
  activeLevel, onLevelChange, activeTopic, onTopicChange, query, onQueryChange, counts,
}: {
  activeLevel: DeckLevel | 'all'; onLevelChange: (l: DeckLevel | 'all') => void; activeTopic: DeckLevel | null; onTopicChange: (t: DeckLevel) => void; query: string; onQueryChange: (q: string) => void; counts: Record<string, number>
}) {
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-border-default bg-surface-raised p-4 shadow-xs">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border-subtle/60 pb-3">
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <input
            type="search"
            placeholder="Buscar mazo o palabra..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full rounded-2xl border border-border-default bg-surface-sunken py-2 pl-9 pr-3.5 font-sans text-body-sm text-fg placeholder:text-fg-muted transition-all focus:border-border-strong focus:bg-surface-raised focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-sunken p-1 rounded-2xl border border-border-subtle overflow-x-auto scrollbar-none">
          {LEVEL_SCALE.map((lvl) => (
            <button
              key={lvl.id}
              type="button"
              onClick={() => onLevelChange(lvl.id)}
              className={cn(
                'focus-ring inline-flex items-center gap-1 rounded-xl px-3 py-1 font-sans text-caption font-semibold transition-all select-none shrink-0',
                activeLevel === lvl.id && activeTopic === null ? 'bg-ink text-paper shadow-xs font-bold' : 'text-fg-muted hover:text-fg',
              )}
            >
              <span>{lvl.label}</span>
              {lvl.id !== 'all' && <span className="font-mono text-tiny opacity-70">{counts[lvl.id] || 0}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none pt-0.5">
        <span className="font-sans text-tiny font-bold uppercase tracking-wider text-fg-muted mr-1">Temas:</span>
        {TOPIC_GROUPS.map((item) => {
          const count = counts[item.id] || 0
          if (count === 0) return null
          const isActive = activeTopic === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTopicChange(item.id)}
              className={cn(
                'focus-ring inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-caption font-semibold transition-all select-none shrink-0',
                isActive ? 'bg-ink text-paper shadow-xs font-bold' : 'border border-border-subtle bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg',
              )}
            >
              <span>{item.label}</span>
              <span className={cn('font-mono text-tiny font-bold rounded-full px-1.5 py-0.2', isActive ? 'bg-paper/20 text-paper' : 'bg-surface-raised text-fg-subtle')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DeckGrid({ decks, showLevelBadge, featuredFirst }: { decks: DeckSummary[]; showLevelBadge: boolean; featuredFirst?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense">
      {decks.map((deck, idx) => (
        <DeckCard key={deck.slug} deck={deck} showLevelBadge={showLevelBadge} isFeatured={featuredFirst && idx === 0} />
      ))}
    </div>
  )
}

function DeckCard({ deck, showLevelBadge, isFeatured }: { deck: DeckSummary; showLevelBadge: boolean; isFeatured?: boolean }) {
  const IconComponent = ICON_MAP[deck.iconName] ?? Lightbulb
  const displayTitle = deck.shortTitle || deck.title
  const isCustomCardCount = deck.cardCount !== 6

  return (
    <Link
      href={`/practice/decks/${deck.slug}`}
      className={cn(
        'group relative flex flex-col justify-between gap-3 rounded-3xl border border-border-default bg-surface-raised p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-ring select-none min-h-[145px]',
        isFeatured && 'sm:col-span-2 bg-gradient-to-br from-surface-raised via-surface-raised to-surface-sunken/40 border-border-strong/60',
      )}
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div data-tone={deck.tone} className="pastel-card flex size-10 items-center justify-center rounded-2xl shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <IconComponent size={18} className="text-ink" aria-hidden />
          </div>
          {showLevelBadge && (
            <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-mono text-tiny font-bold text-fg-muted uppercase tracking-wider shrink-0">
              {deck.level.toUpperCase()}
            </span>
          )}
        </div>
        <h3 className="font-heading text-body-md font-bold text-fg group-hover:text-primary transition-colors leading-snug line-clamp-2">
          {displayTitle}
        </h3>
        {deck.sampleWords.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {deck.sampleWords.slice(0, isFeatured ? 4 : 3).map((word) => (
              <span key={word} className="inline-flex items-center rounded-md bg-surface-sunken border border-border-subtle/70 px-2 py-0.5 font-mono text-tiny font-medium text-fg-muted">
                {word}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border-subtle/60 text-tiny font-sans text-fg-muted">
        <span className="font-medium text-fg-subtle">
          {isCustomCardCount ? `${deck.cardCount} tarjetas · ${deck.durationMinutes} min` : 'Sin empezar'}
        </span>
      </div>
    </Link>
  )
}

