// Planned structure:
// <StatBlock>
//   <StatColumn × n />   — big number + muted label
// </StatBlock>

import { cn } from '@/lib/cn'

export interface StatBlockItem {
  label: string
  value: number
  /** Highlights the value in the info color, for the standout stat in the row. */
  accent?: boolean
}

interface Props {
  stats: StatBlockItem[]
}

function StatColumn({ label, value, accent }: StatBlockItem) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1">
      <span
        className={cn(
          'type-stat text-h3 tracking-tight',
          accent ? 'text-info' : 'text-fg',
        )}
      >
        {value}
      </span>
      <span className="text-center font-kicker text-fg-subtle">{label}</span>
    </div>
  )
}

export function StatBlock({ stats }: Props) {
  return (
    <div className="grid w-full grid-cols-3 gap-layout-stack rounded-md border border-border-subtle bg-surface-raised p-4 sm:gap-space-5 sm:p-5">
      {stats.map((stat) => (
        <StatColumn key={stat.label} {...stat} />
      ))}
    </div>
  )
}
