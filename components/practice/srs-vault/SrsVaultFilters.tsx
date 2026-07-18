'use client'

import Button from '@/components/ui/Button'
import type { VaultFilter } from '@/lib/srs/vault'

const FILTER_OPTIONS: { value: VaultFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'snoozed', label: 'En pausa' },
  { value: 'mastered', label: 'Dominadas' },
]

type SrsVaultFiltersProps = {
  value: VaultFilter
  onChange: (value: VaultFilter) => void
}

export function SrsVaultFilters({ value, onChange }: SrsVaultFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar baúl">
      {FILTER_OPTIONS.map(({ value: optionValue, label }) => (
        <Button
          key={optionValue}
          type="button"
          variant={value === optionValue ? 'soft' : 'ghost'}
          size="sm"
          onClick={() => onChange(optionValue)}
        >
          {label}
        </Button>
      ))}
    </div>
  )
}
