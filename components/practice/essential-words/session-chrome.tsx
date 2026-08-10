import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

export function SessionShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-layout-session-max flex-col gap-layout-stack',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface SessionSurfaceProps {
  children: ReactNode
  className?: string
  /** Visual weight only — does not change page structure. */
  density?: 'default' | 'compact' | 'primary'
}

export function SessionSurface({
  children,
  className,
  density = 'default',
}: SessionSurfaceProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-xl border border-border-subtle bg-daily-card',
        density === 'compact' &&
          'gap-layout-stack-tight p-[var(--layout-card-pad)]',
        density === 'default' && 'layout-card-pad gap-layout-stack',
        density === 'primary' &&
          'gap-layout-stack-loose p-[var(--layout-card-pad)] sm:p-[calc(var(--layout-card-pad)+0.25rem)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
