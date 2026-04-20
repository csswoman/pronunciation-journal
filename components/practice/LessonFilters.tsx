'use client'

import Button from '@/components/ui/Button'

export type PracticeFilter = 'all' | 'basics' | 'vowels' | 'consonants' | 'diphthongs'

export const FILTERS: { id: PracticeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basics', label: 'Basics' },
  { id: 'vowels', label: 'Vowels' },
  { id: 'consonants', label: 'Consonants' },
  { id: 'diphthongs', label: 'Diphthongs' },
]

interface LessonFiltersProps {
  filter: PracticeFilter
  search: string
  resultCount: number
  onFilterChange: (f: PracticeFilter) => void
  onSearchChange: (s: string) => void
}

export default function LessonFilters({
  filter,
  search,
  resultCount,
  onFilterChange,
  onSearchChange,
}: LessonFiltersProps) {
  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          {FILTERS.map((chip) => (
            <Button
              key={chip.id}
              type="button"
              onClick={() => onFilterChange(chip.id)}
              variant="chip"
              size="sm"
              selected={filter === chip.id}
              className="rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              {chip.label}
            </Button>
          ))}
        </div>

        <div className="w-full lg:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search lessons..."
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
            style={{
              borderColor: 'var(--line-divider)',
              backgroundColor: 'var(--card-bg)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      <p
        className="text-sm font-semibold tracking-[0.12em] uppercase mb-6"
        style={{ color: 'var(--text-secondary)' }}
      >
        {resultCount} exercises available
      </p>
    </>
  )
}
