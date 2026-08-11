'use client'

import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'

interface Props {
  label?: string
  onArchive?: () => void
}

export function ExercisePhaseLabel({ label, onArchive }: Props) {
  if (!label && !onArchive) return null
  return (
    <div className="flex w-full flex-col items-center gap-1.5">
      {label && <p className="m-0 w-full text-center font-kicker text-fg-subtle">{label}</p>}
      {onArchive && <ArchiveConfirmAction onArchive={onArchive} label="Pausar esta palabra" />}
    </div>
  )
}
