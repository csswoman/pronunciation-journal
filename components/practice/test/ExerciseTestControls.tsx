'use client'

// Planned structure:
// <ExerciseTestControls>
//   <ContextSelectorA />
//   <ContextSelectorB />
//   <ContextInfo />
//   <ActionButtons />
// </ExerciseTestControls>

import { Columns2, Layers, Sparkles } from "@/components/icons"
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
  onOpenEssentialWords: () => void
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
  onOpenEssentialWords,
}: Props) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4">
      <div className="flex flex-col gap-2">
        <span className="font-kicker text-fg-subtle">
          Panel A (Principal)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_UI_CONTEXTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onContextChange(value)}
              className={cn(
                'min-h-8 rounded-full px-2.5 py-1 text-caption font-medium transition-colors focus-ring',
                context === value
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'bg-surface-sunken text-fg-secondary hover:text-fg',
              )}
            >
              {CONTEXT_LABELS[value]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-kicker text-fg-subtle">
          Panel B (Comparación)
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FOCUS_UI_CONTEXTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onCompareContextChange(value)}
              className={cn(
                'min-h-8 rounded-full px-2.5 py-1 text-caption font-medium transition-colors focus-ring',
                compareContext === value
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
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
          variant="primary"
          size="sm"
          icon={<Sparkles size={14} />}
          onClick={onOpenEssentialWords}
          fullWidth
        >
          Palabras esenciales
        </Button>
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
