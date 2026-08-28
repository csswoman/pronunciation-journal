'use client'

// Planned structure:
// <PhonemeChip />
// <PhonemeChips />
// getPhonemeErrorDescription()
// buildDetailedTip()

import type { WordResult, PhonemeAlignment } from '@/lib/types'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { cn } from '@/lib/cn'

interface PhonemeChipProps {
  p: PhonemeAlignment
  size?: 'sm' | 'md'
  onSelect?: (p: PhonemeAlignment) => void
  interactive?: boolean
}

export function getPhonemeErrorDescription(p: PhonemeAlignment): string {
  const display = p.ipa ?? p.phoneme.toLowerCase()
  if (p.status === 'missing') {
    return `Falta el sonido /${display}/ (no se detectó en la pronunciación)`
  }
  if (p.status === 'incorrect') {
    const heard = p.gotIpa ?? p.got ?? '?'
    return `Se esperaba /${display}/ pero se reconoció /${heard}/`
  }
  return `Sonido /${display}/ correcto`
}

export function PhonemeChip({
  p,
  size = 'sm',
  onSelect,
  interactive = true,
}: PhonemeChipProps) {
  const display = p.ipa ?? p.phoneme.toLowerCase()
  const isProblematic = p.status === 'incorrect' || p.status === 'missing'

  const label =
    p.status === 'incorrect'
      ? `Escuchar modelo /${display}/; reconocido /${p.gotIpa ?? p.got ?? '?'}/`
      : p.status === 'missing'
        ? `Escuchar modelo /${display}/; no apareció en la pronunciación`
        : `Escuchar modelo /${display}/`

  const statusClasses =
    p.status === 'missing'
      ? 'bg-warning-soft/40 text-warning border-warning/60 line-through'
      : p.status === 'incorrect'
        ? 'bg-error-soft/40 text-error border-error/60'
        : 'bg-success-soft/30 text-success border-success/40'

  const sizeClasses =
    size === 'sm'
      ? 'h-6 px-1.5 text-caption font-ipa'
      : 'h-8 px-2 text-body-sm font-ipa'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (p.ipa) playIpaSound(p.ipa)
        onSelect?.(p)
      }}
      aria-label={label}
      disabled={!interactive}
      className={cn(
        'inline-flex items-center justify-center gap-0.5 rounded-sm border transition-colors focus-ring',
        sizeClasses,
        statusClasses,
        interactive && 'cursor-pointer hover:opacity-90 active:scale-95'
      )}
    >
      /{display}/
      {isProblematic && (
        <svg
          className="ml-0.5 h-2.5 w-2.5 shrink-0 opacity-70"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      )}
    </button>
  )
}

export function PhonemeChips({
  alignment,
  size = 'sm',
  onSelectPhoneme,
}: {
  alignment: PhonemeAlignment[]
  size?: 'sm' | 'md'
  onSelectPhoneme?: (p: PhonemeAlignment) => void
}) {
  if (alignment.length === 0) return null
  return (
    <div className="inline-flex flex-wrap items-center gap-1">
      {alignment.map((p, i) => (
        <PhonemeChip
          key={i}
          p={p}
          size={size}
          onSelect={onSelectPhoneme}
        />
      ))}
    </div>
  )
}

export function buildDetailedTip(result: WordResult): string | null {
  const alignment = result.phonemes?.alignment
  if (!alignment || alignment.length === 0) return result.phonemes?.tip ?? null

  const problems: string[] = []
  for (const p of alignment) {
    const exp = p.ipa ?? `/${p.phoneme}/`
    if (p.status === 'incorrect' && p.got) {
      const got = p.gotIpa ?? `/${p.got}/`
      problems.push(`/${exp}/ → escuchado /${got}/`)
    } else if (p.status === 'missing') {
      problems.push(`falta /${exp}/`)
    }
  }
  if (problems.length === 0) return null
  return problems.join(' · ')
}
