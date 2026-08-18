import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import WordSearchSession from '@/components/practice/word-search/WordSearchSession'

export const metadata = {
  title: 'Búsqueda de Palabras',
  description: 'Sopa de letras interactiva y deducción de vocabulario por pistas fonéticas',
}

export default function WordSearchPage() {
  return (
    <PageLayout archetype="session" className="flex flex-col layout-section-gap">
      <PageHeader
        kicker="Práctica Interactiva"
        title="Búsqueda de Palabras"
        subtitle="Entrena tu reconocimiento ortográfico, deducción por pistas y pronunciación en una sopa de letras interactiva."
      />
      <WordSearchSession />
    </PageLayout>
  )
}
