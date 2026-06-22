import PageLayout from '@/components/layout/PageLayout'
import Link from 'next/link'
import { listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { DecksIndexClient } from '@/components/practice/decks/DecksIndexClient'

export default function DecksIndexPage() {
  const decks = listAllDecks()

  return (
    <PageLayout cardWrapper={false} className="pb-18">
      <div className="w-full">
        <header className="flex flex-col gap-1.5 pt-2 pb-5 sm:pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-fg-subtle">
            Grammar decks
          </span>
          <h1 className="font-display text-display-word sm:text-h2 font-normal leading-tight tracking-[-0.02em] text-fg">
            All decks
          </h1>
          <p className="text-sm text-fg-muted">
            {decks.length} decks · browse by level or search by topic
          </p>
        </header>
        <Link
          href="/practice/core-1000"
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
