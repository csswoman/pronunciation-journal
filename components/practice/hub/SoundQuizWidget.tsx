'use client'

// Planned structure:
// <SoundQuizWidget>
//   header: kicker + category selector (Todos / Vocales / Consonantes)
//   title + link to /practice/sounds
//   <SoundMicroQuiz category />
//   footer CTA to /practice/sounds
// </SoundQuizWidget>

import { useState } from 'react'
import Link from 'next/link'
import { MicVocal, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { cn } from '@/lib/cn'
import SoundMicroQuiz, { type SoundCategory } from './SoundMicroQuiz'

export default function SoundQuizWidget() {
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory>('all')
  const [resetKey, setResetKey] = useState(0)

  return (
    <div className="group/hero flex flex-col gap-5 rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 via-surface-raised to-surface-raised p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--hue-icon-bg)] text-primary transition-transform group-hover/hero:scale-105">
              <MicVocal size={18} aria-hidden />
            </span>
            <span className="font-kicker text-fg-subtle">Pronunciación</span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-base/80 p-0.5 shadow-2xs backdrop-blur-xs">
            {(['all', 'vowels', 'consonants'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setResetKey((k) => k + 1)
                }}
                className={cn(
                  'focus-ring rounded-full px-2.5 py-0.5 text-tiny font-medium transition-all duration-150',
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-sunken',
                )}
              >
                {cat === 'all' ? 'Todos' : cat === 'vowels' ? 'Vocales' : 'Consonantes'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Link
            href="/practice/sounds"
            onClick={() => void setLastPracticeMode('sounds')}
            className="focus-ring group/title flex items-center justify-between gap-2 rounded-sm"
          >
            <h2 className="text-h3 font-bold text-fg transition-colors group-hover/title:text-primary">
              Laboratorio de sonidos
            </h2>
            <ArrowRight
              size={18}
              className="text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
              aria-hidden
            />
          </Link>
          <p className="text-body-sm text-fg-muted text-pretty">
            Distingue sonidos parecidos (pares mínimos) y entrena tu oído con grabaciones acústicas reales.
          </p>
        </div>

        <SoundMicroQuiz category={selectedCategory} resetKey={resetKey} />
      </div>

      <div className="pt-2">
        <Link
          href="/practice/sounds"
          onClick={() => void setLastPracticeMode('sounds')}
          className="focus-ring group/btn inline-flex w-full items-center justify-center gap-2 rounded-xl bg-fg px-4 py-3 font-label font-semibold text-surface-base shadow-sm transition-all duration-200 hover:bg-fg/90 hover:shadow-md active:scale-[0.99]"
        >
          <span>Explorar todos los sonidos</span>
          <ArrowRight size={16} className="transition-transform duration-150 group-hover/btn:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
