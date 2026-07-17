import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import Link from 'next/link'
import { listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { DecksIndexClient } from '@/components/practice/decks/DecksIndexClient'

export default function DecksIndexPage() {
  const decks = listAllDecks()

  return (
    <PageLayout>
      <div className="w-full">
        <PageHeader
          kicker="Learn"
          title="Decks"
          subtitle={`${decks.length} mazos · filtra por nivel o busca por tema`}
        />
        <Link
          href="/practice/essential-words"
          className="mb-5 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised px-4 py-3.5 no-underline"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-fg">Essential Words</span>
            <span className="text-label text-fg-muted">
              Las palabras más frecuentes del inglés, con weak forms y repaso espaciado
            </span>
          </div>
          <span className="text-sm text-primary font-medium shrink-0 ml-3">Practicar →</span>
        </Link>
        <DecksIndexClient decks={decks} />
      </div>
    </PageLayout>
  )
}
