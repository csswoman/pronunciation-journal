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
      title={fromDaily ? 'Buen trabajo. Sigue así' : 'Elige una práctica'}
      subtitle={
        fromDaily
          ? 'Terminaste el plan de hoy. Elige qué reforzar ahora.'
          : 'Práctica libre y guiada para entrenar tu inglés.'
      }
    />
  )
}
