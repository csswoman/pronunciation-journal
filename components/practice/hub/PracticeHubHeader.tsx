// Planned structure:
// <PracticeHubHeader>  — title + subtitle, contextual on `fromDaily`
import PageHeader from '@/components/layout/PageHeader'

interface Props {
  fromDaily: boolean
}

export default function PracticeHubHeader({ fromDaily }: Props) {
  return (
    <PageHeader
      variant="compact"
      title={fromDaily ? 'Buen trabajo — sigue así' : 'Práctica libre'}
      subtitle={
        fromDaily
          ? 'Terminaste el plan de hoy. Elige qué reforzar ahora.'
          : 'Elige qué quieres reforzar.'
      }
    />
  )
}
