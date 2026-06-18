'use client'

import { Columns2, Layers } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { CONTEXT_LABELS } from '@/components/practice/test/constants'
import { FOCUS_UI_CONTEXTS, TEST_GALLERY_ENTRIES } from '@/lib/practice/test-gallery/fixtures'
import type { PracticeContext } from '@/lib/practice/types'

interface Props {
  context: PracticeContext
  compareContext: PracticeContext
  canSplit: boolean
  usesFocusShell: boolean
  onContextChange: (value: PracticeContext) => void
  onCompareContextChange: (value: PracticeContext) => void
  onLaunchAll: () => void
  onSplitQuick: () => void
}

export function ExerciseTestControls({
  context,
  compareContext,
  canSplit,
  usesFocusShell,
  onContextChange,
  onCompareContextChange,
  onLaunchAll,
  onSplitQuick,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-4">
      <div className="flex flex-col gap-2">
        <p className="font-caption font-semibold uppercase tracking-wide text-fg-muted">
          Panel A
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_UI_CONTEXTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onContextChange(value)}
              className={cn(
                'rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-medium transition-colors',
                context === value
                  ? 'bg-primary text-white'
                  : 'bg-surface-sunken text-fg-secondary hover:text-fg',
              )}
            >
              {CONTEXT_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-caption font-semibold uppercase tracking-wide text-fg-muted">
          Panel B
        </p>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_UI_CONTEXTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onCompareContextChange(value)}
              className={cn(
                'rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-medium transition-colors',
                compareContext === value
                  ? 'bg-primary text-white'
                  : 'bg-surface-sunken text-fg-secondary hover:text-fg',
              )}
            >
              {CONTEXT_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <p className="font-caption leading-relaxed text-fg-muted">
        {usesFocusShell ? 'Focus shell' : 'Layout plano'}
        {canSplit ? (
          <>
            {' · '}
            <span className="text-fg-secondary">
              {CONTEXT_LABELS[context]} | {CONTEXT_LABELS[compareContext]}
            </span>
          </>
        ) : null}
      </p>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Layers size={14} />}
          onClick={onLaunchAll}
          fullWidth
        >
          Recorrer {TEST_GALLERY_ENTRIES.length}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<Columns2 size={14} />}
          disabled={!canSplit}
          onClick={onSplitQuick}
          fullWidth
        >
          Split rápido
        </Button>
      </div>
    </section>
  )
}
