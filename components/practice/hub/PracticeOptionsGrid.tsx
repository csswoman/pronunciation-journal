'use client'

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { PRACTICE_MODES } from '@/lib/practice/practice-modes'
import { MODE_ICONS } from './RecommendedPracticeCard'

// Planned structure:
// <PracticeOptionsGrid> — all modes except the recommended one, as cells

interface Props {
  excludeModeId: string
}

export default function PracticeOptionsGrid({ excludeModeId }: Props) {
  const modes = PRACTICE_MODES.filter((m) => m.id !== excludeModeId)

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {modes.map((mode) => {
        const Icon = MODE_ICONS[mode.icon] ?? MODE_ICONS['MicVocal']
        return (
          <Link
            key={mode.id}
            href={mode.href}
            onClick={() => void setLastPracticeMode(mode.id)}
            className="flex flex-col gap-2.5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4 transition-colors hover:bg-surface-sunken focus-ring"
          >
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-lg)] bg-[var(--hue-icon-bg)] text-[var(--primary)]">
              <Icon size={18} aria-hidden />
            </span>
            <div>
              <p className="font-body-sm font-semibold text-[var(--text-primary)]">{mode.label}</p>
              <p className="font-caption text-[var(--text-tertiary)]">{mode.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
