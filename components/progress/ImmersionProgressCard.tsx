// Planned structure:
// <ImmersionProgressCard>
//   <ProgressCardHeader />
//   <ProgressNumbers />
//   <ImmersionLink />
// </ImmersionProgressCard>

import Link from 'next/link'
import { Headphones } from '@/components/icons'
import type { ImmersionProgressData } from '@/lib/progress/domain-queries'
import { ProgressBigNumber, ProgressCard, ProgressCardHeader } from './ProgressCard'

export function ImmersionProgressCard({ data }: { data: ImmersionProgressData }) {
  return (
    <ProgressCard>
      <ProgressCardHeader
        icon={<Headphones size={16} />}
        eyebrow="Inmersión"
        title="Comprensión en contexto"
      />
      {data.watched === 0 ? (
        <p className="text-caption text-fg-muted">
          Mira una lección de inmersión para comenzar a registrar este recorrido.
        </p>
      ) : (
        <div className="flex flex-wrap gap-[var(--layout-stack-loose)]">
          <ProgressBigNumber value={data.watched} sub={`vistas de ${data.total}`} />
          <ProgressBigNumber value={data.completed} sub="con quiz aprobado" />
          <ProgressBigNumber value={data.due} sub="por retomar" tone={data.due > 0 ? 'warning' : 'primary'} />
        </div>
      )}
      <Link href="/practice/immersion" className="mt-1 inline-flex min-h-[44px] items-center text-body-sm font-semibold text-primary transition-opacity hover:opacity-80 focus-ring">
        Abrir inmersión →
      </Link>
    </ProgressCard>
  )
}
