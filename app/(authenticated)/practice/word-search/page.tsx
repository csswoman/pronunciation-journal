import PageLayout from '@/components/layout/PageLayout'
import WordSearchSession from '@/components/practice/word-search/WordSearchSession'

export const metadata = {
  title: 'Sopa de letras',
  description: 'Encuentra vocabulario en inglés con pistas, audio y práctica ortográfica',
}

export default function WordSearchPage() {
  return (
    <PageLayout archetype="catalog">
      <WordSearchSession />
    </PageLayout>
  )
}
