'use client'

/*
 * Subcomponents:
 * - DailyStepItem
 *   - DailyStepTitle
 *   - Step status indicators & badges (Check, Siguiente, Opcional)
 *   - Action buttons / Next Link
 */

import type { CSSProperties } from 'react'
import Link from 'next/link'
import { ArrowRight, Check } from "@/components/icons"
import { DailyStepTitle } from './DailyStepTitle'
import type { DailyStep } from '@/lib/practice/types'
import { cn } from '@/lib/cn'
import {
  localizeDailyStepSubtitle,
  localizeDailyStepTitle,
} from '@/lib/daily/localize-step-copy'
import { stepMeta } from './daily-step-list-helpers'

interface DailyStepItemProps {
  step: DailyStep
  index: number
  visual: 'done' | 'entry' | 'current' | 'pending'
  justCompleted: boolean
  isEntryOrCurrent: boolean
  compact: boolean
  staggerIndex?: number
  isEntry: boolean
  demoteEntryHighlight?: boolean
  onStartStep: (step: DailyStep) => void
}

export function DailyStepItem({
  step,
  index,
  visual,
  justCompleted,
  isEntryOrCurrent,
  compact,
  staggerIndex,
  isEntry,
  demoteEntryHighlight,
  onStartStep,
}: DailyStepItemProps) {
  const done = visual === 'done'
  const isReadingStep = step.kind === 'concept' || step.kind === 'study_deck'
  const cardCount = step.studyCards?.length ?? 0
  const hasReader = !!step.readerPassage
  const isStartable = step.exercises.length > 0 || cardCount > 0 || hasReader || Boolean(step.missionLaunch)

  const rowClass = cn(
    'min-w-0',
    staggerIndex !== undefined && 'list-stagger',
  )
  const rowStyle =
    staggerIndex !== undefined
      ? ({ '--stagger-index': staggerIndex } as CSSProperties)
      : undefined

  const cardClass = cn(
    'home-card-lift focus-ring group flex w-full min-h-11 items-center gap-3 rounded-xl text-left transition-colors',
    compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
    visual === 'entry' &&
      (demoteEntryHighlight
        ? 'border border-border-default bg-surface-raised hover:border-border-default'
        : 'border border-border-default bg-surface-raised hover:border-primary/40 text-fg'),
    visual === 'current' &&
      'border border-primary/40 bg-primary/10 text-fg',
    visual === 'pending' &&
      'border border-transparent bg-transparent hover:bg-surface-sunken/70',
    visual === 'done' &&
      'border border-transparent bg-transparent',
  )

  const localizedSubtitle = localizeDailyStepSubtitle(step.subtitle)
  const stepMetaText = stepMeta(step)
  const stepNumber = (
    <span
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full text-caption font-bold shrink-0 select-none",
        visual === 'entry' || visual === 'current'
          ? 'bg-primary text-on-primary shadow-xs'
          : done
          ? 'bg-success-soft text-success'
          : 'bg-surface-sunken text-fg-muted'
      )}
    >
      {index + 1}
    </span>
  )

  const inner = compact ? (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {stepNumber}
        <div className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate font-body-sm font-medium',
              done ? 'text-fg-muted' : 'text-fg',
            )}
          >
            {localizeDailyStepTitle(step.title)}
          </span>
          {!done && localizedSubtitle ? (
            <span className="mt-0.5 block truncate font-caption text-fg-muted">
              {localizedSubtitle}
            </span>
          ) : null}
        </div>
      </div>
      {done ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-success-soft px-2 py-0.5 font-caption font-semibold text-success">
          <Check size={14} aria-hidden />
          Hecho
        </span>
      ) : (
        <div className="flex items-center gap-1.5 shrink-0">
          {isEntry ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-caption font-semibold text-on-primary">
              Siguiente
            </span>
          ) : step.id === 'journal_entry' || step.href === '/journal' ? (
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 font-caption font-semibold text-amber-800 dark:text-amber-300">
              Opcional
            </span>
          ) : null}
          <span className="w-14 text-right font-caption tabular-nums text-fg-muted">
            {step.estMinutes} min
          </span>
        </div>
      )}
    </div>
  ) : (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {stepNumber}
        <div className="min-w-0 flex-1">
          <DailyStepTitle
            title={localizeDailyStepTitle(step.title)}
            ipa={step.ipa}
            muted={done}
          />
          {(localizedSubtitle || stepMetaText) ? (
            <p
              className={cn(
                'mt-0.5 truncate font-body-sm',
                done
                  ? 'text-fg-muted'
                  : isEntryOrCurrent
                    ? 'text-fg font-medium'
                    : 'text-fg-muted',
              )}
            >
              {[localizedSubtitle, stepMetaText]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </div>
      </div>
      {done ? (
        <div className="flex shrink-0 items-center gap-2.5">
          <span
            className={cn(
              "animate-state-in inline-flex items-center gap-1 rounded-md bg-accent-2-soft px-2.5 py-1 font-caption font-semibold text-accent-2",
              justCompleted && "success-pulse",
            )}
          >
            <Check size={16} aria-hidden />
            Hecho
          </span>
          <span className="w-6 shrink-0" aria-hidden />
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-2">
          {isEntry ? (
            <span className="rounded-full bg-primary px-2.5 py-0.5 font-caption font-semibold text-on-primary">
              Siguiente
            </span>
          ) : step.id === 'journal_entry' || step.href === '/journal' ? (
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 font-caption font-semibold text-amber-800 dark:text-amber-300">
              Opcional
            </span>
          ) : null}
          <span className="w-14 text-right font-caption tabular-nums text-fg-muted">
            {step.estMinutes} min
          </span>
          <ArrowRight
            size={18}
            className={cn(
              "w-6 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5",
              isEntryOrCurrent ? "text-primary" : "text-fg-muted group-hover:text-primary"
            )}
          />
        </div>
      )}
    </div>
  )

  if (isReadingStep && step.href) {
    return (
      <li className={rowClass} style={rowStyle}>
        <Link href={step.href} className={cardClass}>
          {inner}
        </Link>
      </li>
    )
  }

  return (
    <li className={rowClass} style={rowStyle}>
      <button
        type="button"
        className={cardClass}
        onClick={() => onStartStep(step)}
        disabled={!isStartable || done}
      >
        {inner}
      </button>
    </li>
  )
}
