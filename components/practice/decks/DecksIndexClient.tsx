'use client'

// Planned structure:
// <DecksIndexClient>
//   <LevelFilterBar />
//   <SearchInput />
//   <DeckGrid>
//     <DeckCard /> × N
//   </DeckGrid>
// </DecksIndexClient>

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { BookOpen, Volume2, HelpCircle, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { DeckSummary, DeckLevel } from '@/lib/courses/grammar-deck/decks'

interface Props {
  decks: DeckSummary[]
}

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

  return (
    <div className="flex flex-col gap-6">
      <LevelFilterBar
        levels={availableLevels}
        active={activeLevel}
        onChange={setActiveLevel}
      />
      <SearchInput value={query} onChange={setQuery} />
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--text-tertiary)]">
          No decks match your filter.
        </p>
      ) : (
        <DeckGrid decks={filtered} />
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
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors focus-ring',
        active
          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]',
      )}
    >
      {label}
    </button>
  )
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative max-w-sm">
      <Search
        size={14}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        aria-hidden
      />
      <input
        type="search"
        placeholder="Search decks…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] py-2 pl-8 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0"
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
      className="group flex flex-col gap-3 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-4 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--surface-sunken)] focus-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-base)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          {LEVEL_LABELS[deck.level] ?? deck.level.toUpperCase()}
        </span>
        <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
          {deck.hasSounds && <Volume2 size={13} aria-label="Sound practice" />}
          {deck.hasQuiz && <HelpCircle size={13} aria-label="Includes quiz" />}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] text-[var(--text-tertiary)]">{deck.eyebrow}</p>
        <p className="font-medium text-sm leading-snug text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
          {deck.title}
        </p>
      </div>

      <div className="flex items-center gap-1.5 text-[var(--text-tertiary)]">
        <BookOpen size={12} aria-hidden />
        <span className="text-[11px]">{deck.cardCount} cards</span>
      </div>
    </Link>
  )
}
