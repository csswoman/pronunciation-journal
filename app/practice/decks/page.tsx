import PageLayout from '@/components/layout/PageLayout'
import Link from 'next/link'
import { listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { DecksIndexClient } from '@/components/practice/decks/DecksIndexClient'

export default function DecksIndexPage() {
  const decks = listAllDecks()

  return (
    <PageLayout cardWrapper={false}>
      <div className="mx-auto w-full max-w-[1080px] px-6 pb-18">
        <header className="flex flex-col gap-2 pt-2 pb-8">
          <span className="text-tiny font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
            Grammar decks
          </span>
          <h1 className="font-display text-h2 font-normal leading-tight tracking-[-0.02em] text-[var(--text-primary)]">
            All decks
          </h1>
          <p className="max-w-xl text-sm text-[var(--text-secondary)]">
            {decks.length} decks · browse by level or search by topic
          </p>
        </header>
        <Link
          href="/practice/core-1000"
          className="mb-6 flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] px-5 py-4 no-underline"
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Core 1000</span>
            <span className="text-xs text-[var(--text-secondary)]">
              Las 1000 palabras más frecuentes, con weak forms y repaso espaciado
            </span>
          </div>
          <span className="text-xs text-[var(--primary)] font-medium">Practicar →</span>
        </Link>
        <DecksIndexClient decks={decks} />
      </div>
    </PageLayout>
  )
}
