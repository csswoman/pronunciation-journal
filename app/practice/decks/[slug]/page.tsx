import { notFound } from 'next/navigation'
import GrammarStudyDeck from '@/components/courses/grammar-deck/GrammarStudyDeck'
import { getDeckBySlug } from '@/lib/courses/grammar-deck/decks'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PracticeDeckPage({ params }: PageProps) {
  const { slug } = await params
  const deck = getDeckBySlug(slug)

  if (!deck) notFound()

  return (
    <GrammarStudyDeck
      deck={deck}
      backHref="/practice/decks"
      backLabel="Todos los decks"
    />
  )
}
