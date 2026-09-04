import type { Metadata } from 'next'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import { ReaderEntry } from '@/components/practice/reader/ReaderEntry'
import { ArrowLeft } from '@/components/icons'

export const metadata: Metadata = {
  title: 'Lectura Guiada y Contextual | English Journal',
  description: 'Lecturas comprensibles adaptadas a tu nivel con práctica de shadowing y comprensión lectora.',
}

export default function ReaderPage() {
  return (
    <PageLayout archetype="catalog" className="layout-stack-md py-6">
      <div className="flex items-center justify-between">
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring rounded py-1"
        >
          <ArrowLeft className="size-4" />
          <span>Volver al Hub de Práctica</span>
        </Link>
      </div>

      <header className="page-header w-full">
        <span className="font-kicker text-primary">Input Comprensible</span>
        <h1 className="text-h1 text-fg mt-1">Lectura Guiada</h1>
        <p className="text-body text-fg-muted max-w-2xl text-pretty mt-1">
          Historias adaptadas a tu nivel con vocabulario clave.
        </p>
      </header>

      <main className="w-full">
        <ReaderEntry />
      </main>
    </PageLayout>
  )
}
