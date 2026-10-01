'use client'

// Planned structure:
// <GapSuggestionCard>
//   <PastelCard tone={tone}>
//     <HeaderBadgeRow>
//       <Badges (Sonido/Gramatica + Level + Source)>
//       <CheckboxCircle />
//     </HeaderBadgeRow>
//     <Title (Bricolage font)>
//     <ReasonSubtitle>
//     <BottomWhiteInsetPanel>
//       <AccuracyMeter OR ExampleCompare OR PhonemeChips>
//     </BottomWhiteInsetPanel>
//   </PastelCard>
// </GapSuggestionCard>

import React from 'react'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getTopicMetadata, hasExample } from '@/lib/focus/topic-metadata'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'

interface GapSuggestionCardProps {
  suggestion: GapSuggestion
  selected: boolean
  disabled?: boolean
  tone?: PastelTone
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
  tone = 'coral',
  onToggle,
}: GapSuggestionCardProps) {
  const isPhoneme = suggestion.kind === 'phoneme'
  const meta = getTopicMetadata(suggestion.targetId)
  const showExample = hasExample(meta)
  const hasEvidence = typeof suggestion.accuracy === 'number'

  return (
    <PastelCard
      tone={tone}
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
        'focus-ring relative flex flex-col justify-between gap-4 rounded-3xl p-5 sm:p-6 text-left transition-all',
        disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:scale-[1.008]',
        selected
          ? 'ring-2 ring-ink ring-offset-2 shadow-md'
          : 'shadow-xs hover:shadow-md',
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-full bg-black/10 px-2.5 py-0.5 ts-badge text-ink">
              {isPhoneme ? 'Sonido' : 'Gramática'}
            </span>
            <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 ts-badge text-ink">
              {suggestion.level.toUpperCase()}
            </span>
            <span className="ts-caption text-ink-secondary">
              {SOURCE_LABEL[suggestion.source]}
            </span>
          </div>
          <div
            aria-hidden="true"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all',
              selected
                ? 'border-transparent bg-ink text-white shadow-xs'
                : 'border-black/30 bg-white/80',
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        <div>
          <h3 className="ts-headline-xl text-ink leading-tight">
            {suggestion.label}
          </h3>
          <p className="mt-1.5 ts-body leading-relaxed text-ink-secondary">
            {suggestion.reason}
          </p>
        </div>
      </div>

      {hasEvidence ? (
        <div className="rounded-2xl bg-white/90 p-4 text-ink shadow-xs">
          <div className="flex items-baseline justify-between gap-2">
            <span className="ts-kicker text-ink-muted">
              TU PRECISIÓN
            </span>
            <span className="ts-headline text-ink">
              {suggestion.accuracy}%
            </span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-ink transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, suggestion.accuracy!))}%` }}
            />
          </div>
          {suggestion.sampleCount ? (
            <span className="mt-1.5 block ts-caption text-ink-muted">
              Basado en {suggestion.sampleCount} intentos
            </span>
          ) : null}
        </div>
      ) : showExample ? (
        <div className="flex flex-col gap-1.5 rounded-2xl bg-white/90 p-4 text-ink shadow-xs">
          <div className="flex items-center gap-2 ts-body text-red-600">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 ts-badge">
              ✕
            </span>
            <span className="line-through decoration-1 opacity-80">{meta.wrong}</span>
          </div>
          <div className="flex items-center gap-2 ts-label-strong text-emerald-800">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 ts-badge">
              ✓
            </span>
            <span>{meta.right}</span>
          </div>
        </div>
      ) : suggestion.targetId === 'vowel:/ɪ/' ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-white/90 p-4 text-ink shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/5 px-3 py-1 ts-ipa-sm text-ink border border-black/10">
              ship /ʃɪp/
            </span>
            <span className="rounded-full bg-black/5 px-3 py-1 ts-ipa-sm text-ink border border-black/10">
              sheep /ʃi:p/
            </span>
          </div>
          <span className="ts-caption text-ink-muted shrink-0">Aún sin medir</span>
        </div>
      ) : null}
    </PastelCard>
  )
}
