'use client'

// Planned structure:
// <GapSuggestionCard>
//   <badges + checkbox />
//   <label + reason />
//   <AccuracyBar />        (solo con evidencia real)
//   <AccuracyTrendSparkline />
//   <example wrong → right />
// </GapSuggestionCard>

import React from 'react'
import Badge from '@/components/ui/Badge'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getTopicMetadata, hasExample } from '@/lib/focus/topic-metadata'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'
import { AccuracyBar } from './AccuracyBar'
import { AccuracyTrendSparkline } from './AccuracyTrendSparkline'

interface GapSuggestionCardProps {
  suggestion: GapSuggestion
  selected: boolean
  disabled?: boolean
  onToggle: () => void
}

const SOURCE_LABEL: Record<GapSuggestion['source'], string> = {
  history: 'Según tu práctica',
  pronunciation: 'Según tu pronunciación',
  default: 'Frecuente en hispanohablantes',
}

export function GapSuggestionCard({
  suggestion,
  selected,
  disabled = false,
  onToggle,
}: GapSuggestionCardProps) {
  const isPhoneme = suggestion.kind === 'phoneme'
  const meta = getTopicMetadata(suggestion.targetId)
  const showExample = hasExample(meta)
  const hasEvidence = typeof suggestion.accuracy === 'number'

  return (
    <div
      onClick={disabled ? undefined : onToggle}
      role="checkbox"
      aria-checked={selected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (disabled) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'focus-ring relative flex flex-col gap-2.5 rounded-xl border p-4 text-left transition-all',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
        selected
          ? 'border-primary bg-primary-soft shadow-xs'
          : 'border-border-default bg-surface-raised hover:border-border-hover',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge label={isPhoneme ? 'Sonido' : 'Gramática'} variant={isPhoneme ? 'info' : 'default'} size="sm" />
          <Badge label={suggestion.level.toUpperCase()} variant="neutral" size="sm" />
          <span className="text-tiny text-fg-subtle">{SOURCE_LABEL[suggestion.source]}</span>
        </div>
        <div
          aria-hidden="true"
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition-colors',
            selected
              ? 'border-primary bg-primary text-on-primary'
              : 'border-border-default bg-surface-sunken',
          )}
        >
          {selected && <Check className="h-3.5 w-3.5 text-on-primary" strokeWidth={2.5} />}
        </div>
      </div>

      <div>
        <h4 className="text-body font-semibold text-fg">{suggestion.label}</h4>
        <p className="mt-1 text-body-sm leading-relaxed text-fg-muted">{suggestion.reason}</p>
      </div>

      {hasEvidence && (
        <div className="flex items-end gap-3">
          <AccuracyBar
            label="Tu precisión"
            value={suggestion.accuracy!}
            sampleCount={suggestion.sampleCount}
            className="min-w-0 flex-1"
          />
          {suggestion.trend && <AccuracyTrendSparkline trend={suggestion.trend} />}
        </div>
      )}

      {showExample && (
        <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-surface-sunken p-2.5">
          <div className="flex items-center gap-1.5 text-tiny">
            <span className="shrink-0 font-medium text-warning">✕ Decías:</span>
            <span className="line-through decoration-1 text-fg-muted">{meta.wrong}</span>
          </div>
          <div className="flex items-center gap-1.5 text-tiny">
            <span className="shrink-0 font-semibold text-success">✓ Lo ideal:</span>
            <span className="font-medium text-fg">{meta.right}</span>
          </div>
        </div>
      )}
    </div>
  )
}

