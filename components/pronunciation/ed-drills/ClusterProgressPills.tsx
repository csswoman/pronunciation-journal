import { cn } from '@/lib/cn'
import type { EdCluster, UserEdClusterProgress } from '@/lib/pronunciation/ed-drills/types'

interface ClusterProgressPillsProps {
  progressByCluster: ReadonlyMap<EdCluster, UserEdClusterProgress>
}

export function ClusterProgressPills({ progressByCluster }: ClusterProgressPillsProps) {
  if (progressByCluster.size === 0) return null

  return (
    <div aria-label="Progreso por cluster" className="flex flex-wrap gap-2">
      {[...progressByCluster.values()].map((progress) => (
        <span
          key={progress.cluster}
          className={cn(
            'rounded-full border px-3 py-1 font-mono text-caption',
            progress.accuracy >= 0.8
              ? 'border-success bg-success-soft text-success'
              : 'border-border-subtle bg-surface-sunken text-fg-muted',
          )}
        >
          /{progress.cluster}/ · {Math.round(progress.accuracy * 100)}%
        </span>
      ))}
    </div>
  )
}
