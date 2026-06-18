import type { ReactNode } from 'react'

interface Props {
  title: string
  count: number
  emptyMessage: string
  children?: ReactNode
}

export function ReviewSectionCard({ title, count, emptyMessage, children }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-medium text-fg">{title}</h2>
        <span className="font-caption text-fg-muted">
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      </div>
      {count === 0 ? (
        <p className="font-body-sm text-fg-subtle">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  )
}
