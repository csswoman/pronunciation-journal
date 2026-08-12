'use client'

// Planned structure:
// <DecksIndexClient>
//   <LevelFilterBar />
//   <SearchInput />
//   <DeckGrid>
//     <DeckCard /> × N
//   </DeckGrid>
//   <DeckPagination />
// </DecksIndexClient>

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { BookOpen, Search } from "@/components/icons"
import { cn } from '@/lib/cn'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { DeckPagination } from '@/components/practice/decks/DeckPagination'
import type { DeckSummary, DeckLevel } from '@/lib/courses/grammar-deck/decks'

interface Props {
  decks: DeckSummary[]
}

/** Desktop fills 5×3 grid rows; mobile stacks taller cards — paginate sooner. */
const PAGE_SIZE_DESKTOP = 15
const PAGE_SIZE_MOBILE = 8

const LEVEL_LABELS: Record<DeckLevel, string> = {
  a1: 'A1',
  a2: 'A2',
  b1: 'B1',
  b2: 'B2',
  c1: 'C1',
  biz: 'Business',
  tech: 'Tech',
  cs: 'Connected Speech',
  other: 'Other',
}

const ALL_LEVELS: DeckLevel[] = ['a1', 'a2', 'b1', 'b2', 'c1', 'biz', 'tech', 'cs']

export function DecksIndexClient({ decks }: Props) {
  const [activeLevel, setActiveLevel] = useState<DeckLevel | 'all'>('all')
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [layoutReady, setLayoutReady] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const isSmUp = useMediaQuery('(min-width: 640px)')
  // SSR + first paint use desktop size to avoid hydration mismatch; mobile size after mount.
  const pageSize = layoutReady && !isSmUp ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP

  useEffect(() => {
    setLayoutReady(true)
  }, [])

  const availableLevels = useMemo(
    () => ALL_LEVELS.filter((l) => decks.some((d) => d.level === l)),
    [decks],
  )

  const filtered = useMemo(() => {
    let result = decks
    if (activeLevel !== 'all') result = result.filter((d) => d.level === activeLevel)
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (d) => d.title.toLowerCase().includes(q) || d.eyebrow.toLowerCase().includes(q),
      )
    }
    return result
  }, [decks, activeLevel, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeLevel, query])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  function handlePageChange(page: number) {
    setCurrentPage(page)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-[var(--layout-section-gap)]">
      <LevelFilterBar
        levels={availableLevels}
        active={activeLevel}
        onChange={setActiveLevel}
      />
      <SearchInput value={query} onChange={setQuery} />
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-body-sm text-[var(--text-tertiary)]">
          No decks match your filter.
        </p>
      ) : (
        <div ref={listRef} className="flex flex-col gap-4">
          <DeckGrid decks={paginated} />
          <DeckPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  )
}

function LevelFilterBar({
  levels,
  active,
  onChange,
}: {
  levels: DeckLevel[]
  active: DeckLevel | 'all'
  onChange: (l: DeckLevel | 'all') => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterChip label="All" active={active === 'all'} onClick={() => onChange('all')} />
      {levels.map((l) => (
        <FilterChip
          key={l}
          label={LEVEL_LABELS[l]}
          active={active === l}
          onClick={() => onChange(l)}
        />
      ))}
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn( 'rounded-full border px-3.5 py-2 text-label font-medium transition-colors focus-ring sm:py-1.5 sm:text-caption', active ? 'border-primary bg-primary-soft text-primary' : 'border-border-subtle bg-surface-raised text-fg-muted hover:border-border-hover', )}
    >
      {label}
    </button>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
        aria-hidden
      />
      <input
        type="search"
        placeholder="Search decks…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border-subtle bg-surface-raised py-2.5 pl-8 pr-3 text-body-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0 sm:py-2"
      />
    </div>
  )
}

function DeckGrid({ decks }: { decks: DeckSummary[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <DeckCard key={deck.slug} deck={deck} />
      ))}
    </div>
  )
}

function DeckCard({ deck }: { deck: DeckSummary }) {
  return (
    <Link
      href={`/practice/decks/${deck.slug}`}
      className="group flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4 sm:p-4 transition-colors hover:border-border-hover hover:bg-surface-sunken focus-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-border-subtle bg-surface-base px-2.5 py-0.5 font-kicker font-semibold text-fg-subtle">
          {LEVEL_LABELS[deck.level] ?? deck.level.toUpperCase()}
        </span>
        <div className="flex items-center gap-1.5">
          {deck.hasSounds && (
            <span className="rounded-full bg-surface-base border border-border-subtle px-2 py-0.5 text-xxs font-medium text-fg-subtle">
              Sound
            </span>
          )}
          {deck.hasQuiz && (
            <span className="rounded-full bg-surface-base border border-border-subtle px-2 py-0.5 text-xxs font-medium text-fg-subtle">
              Quiz
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-caption text-fg-subtle">{deck.eyebrow}</p>
        <p className="font-medium text-body-sm leading-snug text-fg group-hover:text-primary transition-colors">
          {deck.title}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-fg-subtle">
        <BookOpen size={13} aria-hidden />
        <span className="text-caption">{deck.cardCount} cards</span>
      </div>
    </Link>
  )
}
