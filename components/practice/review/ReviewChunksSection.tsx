// Planned structure:
// <ReviewChunksSection>
//   <ReviewSectionCard title="Expresiones y Chunks" count={chunksCount}>
//     <ChunksContent count={chunksCount} />
//     <ActionButtons onStartReview={onStartReview} />
//   </ReviewSectionCard>
// </ReviewChunksSection>

import Link from 'next/link'
import Button from '@/components/ui/Button'
import { ReviewSectionCard } from './ReviewSectionCard'

interface Props {
  chunksCount: number
  onStartReview: () => void
}

export function ReviewChunksSection({ chunksCount, onStartReview }: Props) {
  if (chunksCount <= 0) return null

  return (
    <ReviewSectionCard
      title="Expresiones y Chunks"
      count={chunksCount}
      emptyMessage="Ninguna expresión pendiente hoy."
    >
      <div className="flex flex-col gap-2 font-body-sm text-fg-secondary">
        <p>
          {chunksCount === 1
            ? 'Tienes 1 expresión lista para afianzar en tu sesión de repaso.'
            : `Tienes ${chunksCount} expresiones listas para afianzar en tu sesión de repaso.`}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-primary p-0 h-auto font-medium"
            onClick={onStartReview}
            data-cuelume-press="press"
            data-cuelume-release="release"
          >
            Repasar en sesión completa →
          </Button>
          <Link
            href="/practice"
            className="font-caption text-fg-muted transition-opacity hover:opacity-80"
          >
            Explorar práctica →
          </Link>
        </div>
      </div>
    </ReviewSectionCard>
  )
}
