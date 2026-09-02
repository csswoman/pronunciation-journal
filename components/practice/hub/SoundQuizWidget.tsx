'use client'

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
    <div className="group/hero flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-colors hover:border-border-strong">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-[var(--hue-icon-bg)] text-primary">
              <MicVocal size={18} aria-hidden />
            </span>
            <span className="font-kicker text-fg-subtle uppercase tracking-wider text-tiny">Pronunciación</span>
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
                  'focus-ring rounded-full px-2.5 py-0.5 text-tiny transition-all duration-150',
                  selectedCategory === cat
                    ? 'border border-border-strong bg-surface-raised font-semibold text-fg shadow-2xs'
                    : 'border border-transparent text-fg-muted hover:text-fg hover:bg-surface-sunken',
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
            <h2 className="text-h2 font-bold text-fg transition-colors group-hover/title:text-primary">
              Laboratorio de sonidos
            </h2>
            <ArrowRight
              size={18}
              className="text-fg-subtle transition-transform duration-200 group-hover/title:translate-x-1 group-hover/title:text-primary"
              aria-hidden
            />
          </Link>
          <p className="text-body-sm text-fg-muted text-pretty">
            Entrena el oído con sonidos que el español no distingue.
          </p>
        </div>

        <SoundMicroQuiz category={selectedCategory} resetKey={resetKey} />

        {/* 3 quick exercise items horizontal bar (bento mockup) */}
        <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
          <Link
            href="/practice/minimal-pairs"
            onClick={() => void setLastPracticeMode('minimal-pairs')}
            className="focus-ring group/item flex flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface-sunken/60 p-2.5 transition-colors hover:border-border-default hover:bg-surface-raised"
          >
            <span className="font-label text-body-xs font-semibold text-fg group-hover/item:text-primary transition-colors">
              Pares mínimos
            </span>
            <span className="font-caption text-[11px] text-fg-subtle">
              10 pares · 4 min
            </span>
          </Link>

          <Link
            href="/practice/intonation"
            onClick={() => void setLastPracticeMode('intonation')}
            className="focus-ring group/item flex flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface-sunken/60 p-2.5 transition-colors hover:border-border-default hover:bg-surface-raised"
          >
            <span className="font-label text-body-xs font-semibold text-fg group-hover/item:text-primary transition-colors">
              Entonación
            </span>
            <span className="font-caption text-[11px] text-fg-subtle">
              6 frases · 3 min
            </span>
          </Link>

          <Link
            href="/practice/connected-speech"
            onClick={() => void setLastPracticeMode('connected-speech')}
            className="focus-ring group/item flex flex-col gap-0.5 rounded-lg border border-border-subtle bg-surface-sunken/60 p-2.5 transition-colors hover:border-border-default hover:bg-surface-raised"
          >
            <span className="font-label text-body-xs font-semibold text-fg group-hover/item:text-primary transition-colors">
              Habla conectada
            </span>
            <span className="font-caption text-[11px] text-fg-subtle">
              8 frases · 3 min
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

