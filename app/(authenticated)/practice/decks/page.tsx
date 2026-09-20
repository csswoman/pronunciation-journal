import PageLayout from '@/components/layout/PageLayout'
import { listAllDecks } from '@/lib/courses/grammar-deck/decks'
import { DecksIndexClient } from '@/components/practice/decks/DecksIndexClient'
import { UserDecksRuntime } from '@/components/vocabulary/decks/UserDecksRuntime'

export default function DecksIndexPage() {
  const decks = listAllDecks()

  return (
    <PageLayout archetype="catalog">
      <div className="w-full flex flex-col gap-10">
        {/* Sección de Tus Mazos (Header + Acciones + Grid de mazos propios) */}
        <section aria-labelledby="user-decks-heading">
          <UserDecksRuntime courseDecksCount={decks.length} />
        </section>

        {/* Sección de Catálogo General de Mazos del Curso */}
        <section className="flex flex-col gap-4 border-t border-border-subtle pt-8" aria-labelledby="catalog-decks-heading">
          <div className="flex flex-col gap-0.5">
            <h2 id="catalog-decks-heading" className="font-heading text-h2 font-extrabold text-fg">
              Mazos del curso
            </h2>
            <p className="font-sans text-body-sm text-fg-muted">
              {decks.length} mazos por tema, situación y nivel.
            </p>
          </div>
          <DecksIndexClient decks={decks} />
        </section>
      </div>
    </PageLayout>
  )
}


