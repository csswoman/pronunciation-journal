'use client'

// Planned structure:
// <GapSuggestionCard>
//   <GapHeader />
//   <GapReason />
// </GapSuggestionCard>

import React from 'react'
import Badge from '@/components/ui/Badge'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'

interface GapSuggestionCardProps {
  suggestion: GapSuggestion
  selected: boolean
  onToggle: () => void
}

export function GapSuggestionCard({ suggestion, selected, onToggle }: GapSuggestionCardProps) {
  const isPhoneme = suggestion.kind === 'phoneme'

  return (
    <div
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={`relative p-4 rounded-xl border transition-all cursor-pointer text-left ${
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm'
          : 'border-[var(--border-default)] bg-[var(--surface-raised)] hover:border-[var(--border-hover)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            label={isPhoneme ? 'Fonema' : 'Gramática'}
            variant={isPhoneme ? 'info' : 'default'}
            size="sm"
          />
          <Badge
            label={suggestion.level.toUpperCase()}
            variant="neutral"
            size="sm"
          />
        </div>
        <div
          className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition-colors shrink-0 ${
            selected
              ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
              : 'border-[var(--border-default)] bg-[var(--surface-base)]'
          }`}
        >
          {selected && '✓'}
        </div>
      </div>

      <h4 className="text-body font-semibold text-[var(--text-primary)] mb-1">
        {suggestion.label}
      </h4>

      <p className="text-body-sm text-[var(--text-secondary)] leading-relaxed">
        {suggestion.reason}
      </p>

      {typeof suggestion.accuracy === 'number' && (
        <div className="mt-2 text-tiny text-[var(--text-tertiary)]">
          Precisión reciente: {suggestion.accuracy}%
        </div>
      )}
    </div>
  )
}
