'use client'

// Planned structure:
// <PhonemeChip />
// <PhonemeChips />
// buildDetailedTip()

import type { WordResult, PhonemeAlignment } from '@/lib/types'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'

export function PhonemeChip({ p }: { p: PhonemeAlignment }) {
  const display = p.ipa ?? p.phoneme.toLowerCase()
  const isProblematic = p.status === 'incorrect' || p.status === 'missing'

  let bg = 'color-mix(in srgb, var(--admonitions-color-tip) 20%, transparent)'
  let border = 'var(--admonitions-color-tip)'
  let color = 'var(--admonitions-color-tip)'

  if (p.status === 'missing') {
    bg = 'transparent'
    border = 'var(--admonitions-color-warning)'
    color = 'var(--admonitions-color-warning)'
  } else if (p.status === 'incorrect') {
    bg = 'color-mix(in srgb, var(--admonitions-color-caution) 20%, transparent)'
    border = 'var(--admonitions-color-caution)'
    color = 'var(--admonitions-color-caution)'
  }

  const label =
    p.status === 'incorrect'
      ? `Escuchar el modelo /${display}/; el texto reconocido fue /${p.gotIpa ?? p.got}/`
      : p.status === 'missing'
        ? `Escuchar el modelo /${display}/; no apareció en el texto reconocido`
        : `Escuchar el modelo /${display}/`

  return (
    <button
      type="button"
      onClick={() => p.ipa && playIpaSound(p.ipa)}
      aria-label={label}
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-0.5 rounded-sm border px-2 py-1 font-ipa text-body-sm transition-colors focus-ring"
      style={{
        backgroundColor: bg,
        borderColor: border,
        color,
        textDecoration: p.status === 'missing' ? 'line-through' : 'none',
        cursor: 'pointer',
      }}
    >
      /{display}/
      {isProblematic && (
        <svg className="ml-0.5 w-2.5 h-2.5 opacity-50" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
      )}
    </button>
  )
}

export function PhonemeChips({ alignment }: { alignment: PhonemeAlignment[] }) {
  if (alignment.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {alignment.map((p, i) => (
        <PhonemeChip key={i} p={p} />
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
