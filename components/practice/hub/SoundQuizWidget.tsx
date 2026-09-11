'use client'

// Planned structure:
// <SoundQuizWidget>
//   header: hand-drawn chip + kicker + title + category filter
//   <SoundMicroQuiz />        — the card's anchor
//   exercise list: three divided rows (pares mínimos / entonación / habla conectada)
// </SoundQuizWidget>

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import SoundMicroQuiz, { type SoundCategory } from './SoundMicroQuiz'

const Illustration = getIllustration('domainSpeaking')

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'vowels', label: 'Vocales' },
  { id: 'consonants', label: 'Consonantes' },
] as const satisfies readonly { id: SoundCategory; label: string }[]

const EXERCISES = [
  { href: '/practice/minimal-pairs', mode: 'minimal-pairs', title: 'Pares mínimos' },
  { href: '/practice/intonation', mode: 'intonation', title: 'Entonación' },
  { href: '/practice/connected-speech', mode: 'connected-speech', title: 'Habla conectada' },
] as const

export default function SoundQuizWidget() {
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('all')
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="group relative flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-primary [&>svg]:h-5 [&>svg]:w-auto">
            <Illustration aria-hidden />
          </span>
          <Link
            href="/practice/sounds"
            onClick={() => void setLastPracticeMode('sounds')}
            className="focus-ring group/title flex items-center gap-1.5 rounded-sm"
          >
            <h2 className="text-h3 font-bold text-fg transition-colors group-hover/title:text-primary">
              Laboratorio de sonidos
            </h2>
            <ArrowRight
              size={16}
              className="shrink-0 text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
              aria-hidden
            />
          </Link>
        </div>

        <div
          role="group"
          aria-label="Filtro de sonidos por categoría"
          className="flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface-sunken/70 p-0.5"
        >
          {CATEGORY_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSelectedCategory(id)
                setResetKey((k) => k + 1)
              }}
              className={cn(
                'focus-ring inline-flex items-center rounded-full px-2.5 py-1 text-tiny transition-colors duration-150',
                selectedCategory === id
                  ? 'bg-surface-raised font-semibold text-fg shadow-2xs'
                  : 'text-fg-muted hover:text-fg',
              )}
              aria-pressed={selectedCategory === id}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <SoundMicroQuiz category={selectedCategory} resetKey={resetKey} />

      <div className="flex flex-col">
        {EXERCISES.map(({ href, mode, title }) => (
          <Link
            key={href}
            href={href}
            onClick={() => void setLastPracticeMode(mode)}
            className="focus-ring group/item flex min-h-11 items-center justify-between gap-3 rounded-[var(--radius-sm)] border-t border-border-subtle px-1 transition-colors duration-150 hover:bg-surface-sunken/60"
          >
            <span className="font-label text-body-xs font-semibold text-fg transition-colors group-hover/item:text-primary">
              {title}
            </span>
            <ArrowRight
              size={14}
              className="shrink-0 text-fg-subtle transition-transform duration-150 group-hover/item:translate-x-0.5 group-hover/item:text-primary"
              aria-hidden
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
