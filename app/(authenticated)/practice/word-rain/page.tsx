import PageLayout from '@/components/layout/PageLayout'
import WordRainSession from '@/components/practice/word-rain/WordRainSession'

export const metadata = {
  title: 'Lluvia de palabras',
  description: 'Juego de mecanografía y vocabulario en inglés según tu nivel de aprendizaje',
}

export default function WordRainPage() {
  return (
    <PageLayout archetype="catalog">
      <WordRainSession />
    </PageLayout>
  )
}
