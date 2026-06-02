import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

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
        'flex flex-col gap-3.5 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5',
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
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-[var(--hue-icon-bg)] text-[15px] text-primary">
        {icon}
      </div>
      <div className="min-w-0 flex flex-col">
        {eyebrow ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-subtle">
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
        className={cn(
          'w-[90px] shrink-0 text-sm font-semibold text-fg',
          labelClassName,
        )}
      >
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-sunken">
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
        className={cn(
          'font-display text-h2 leading-none',
          tone === 'warning' ? 'text-warning' : 'text-primary',
        )}
      >
        {value}
      </div>
      <p className="mt-1 text-body-sm text-fg-muted">{sub}</p>
    </div>
  )
}
