"use client"

import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * Subcomponents:
 * - ProgressCard: Container card
 * - ProgressCardHeader: Card header with icon and title
 * - ProgressStatBar: Linear percentage stat bar
 * - ProgressBigNumber: Large stat callout
 * - ProgressRecentChart: SVG chart with cumulative sum and session breakdown
 */

export function ProgressCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        '@container flex flex-col gap-3.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4 sm:p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function ProgressCardHeader({
  icon,
  title,
  eyebrow,
}: {
  icon: ReactNode
  title: string
  eyebrow?: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-primary-soft text-body-sm text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex flex-col">
        {eyebrow ? (
          <span className="font-kicker font-semibold text-fg-subtle">
            {eyebrow}
          </span>
        ) : null}
        <span className="text-body-sm font-semibold leading-snug text-fg">{title}</span>
      </div>
    </div>
  )
}

export function ProgressStatBar({
  label,
  value,
  barColor = 'var(--primary)',
  labelClassName,
}: {
  label: string
  value: number
  barColor?: string
  labelClassName?: string
}) {
  return (
    <div className="mt-2.5 flex items-center gap-3 first:mt-0">
      <span
        className={cn( 'w-[90px] shrink-0 text-body-sm font-semibold text-fg', labelClassName, )}
      >
        {label}
      </span>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken"
      >
        <span
          className="block h-full w-full rounded-full origin-left transition-transform duration-300 ease-out"
          style={{ transform: `scaleX(${Math.min(1, Math.max(0, value / 100))})`, background: barColor }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-body-sm tabular-nums text-fg-muted">
        {value}%
      </span>
    </div>
  )
}

export function ProgressBigNumber({
  value,
  sub,
  tone = 'primary',
}: {
  value: ReactNode
  sub: string
  tone?: 'primary' | 'warning'
}) {
  return (
    <div>
      <div
        className={cn( 'text-h2 leading-none', tone === 'warning' ? 'text-warning' : 'text-primary', )}
      >
        {value}
      </div>
      <p className="mt-1 text-body-sm text-fg-muted">{sub}</p>
    </div>
  )
}

export interface CategoryProgressItem {
  id: string
  label: string
  percentage: number
  accuracy?: number
  exercises?: number
  color?: string
}

const CATEGORY_COLORS = [
  'var(--primary)',
  'var(--accent-1)',
  'var(--accent-2)',
  'var(--warning)',
  'var(--success)',
]

export function ProgressCategoryChart({
  items,
  overallAccuracy,
  className,
}: {
  items: CategoryProgressItem[]
  overallAccuracy?: number
  className?: string
}) {
  if (items.length === 0) {
    return (
      <div className={cn('py-4 text-center text-body-sm text-fg-muted', className)}>
        Sin actividad reciente para resumir.
      </div>
    )
  }

  const totalShare = items.reduce((acc, item) => acc + item.percentage, 0) || 1

  return (
    <div className={cn('flex flex-col gap-3.5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <span className="font-kicker font-semibold text-fg-subtle">
            Resumen de avance reciente
          </span>
          {overallAccuracy !== undefined ? (
            <p className="text-h3 font-bold leading-tight text-primary">
              {overallAccuracy}% <span className="text-caption font-normal text-fg-muted">precisión promedio</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Segmented Distribution Bar */}
      <div
        role="img"
        aria-label="Distribución de práctica reciente por categoría"
        className="flex h-3 w-full overflow-hidden rounded-full bg-surface-raised border border-border-subtle p-0.5"
      >
        {items.map((item, idx) => {
          const widthPct = (item.percentage / totalShare) * 100
          if (widthPct <= 0) return null
          const color = item.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length]

          return (
            <div
              key={item.id}
              style={{ width: `${widthPct}%`, backgroundColor: color }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
              title={`${item.label}: ${item.percentage}%`}
            />
          )
        })}
      </div>

      {/* Category breakdown summary grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {items.map((item, idx) => {
          const color = item.color || CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-3 py-2 text-body-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate font-semibold text-fg">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 text-caption">
                <span className="font-bold tabular-nums text-primary">{item.percentage}%</span>
                {item.accuracy !== undefined ? (
                  <span className="text-fg-muted">({item.accuracy}% prec.)</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


