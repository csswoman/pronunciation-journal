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

export function SessionSurface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex w-full flex-col rounded-xl border border-border-subtle bg-daily-card',
        'px-[var(--layout-card-pad)] pb-[var(--layout-card-pad)] pt-5',
        className,
      )}
    >
      {children}
    </div>
  )
}
