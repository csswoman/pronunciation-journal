import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import PageLayout from '@/components/layout/PageLayout'
import { EdDrillSession } from '@/components/pronunciation/ed-drills/EdDrillSession'

export const metadata: Metadata = {
  title: 'Escalera de -ed | English Journal',
  description: 'Entrena terminaciones -ed y clusters finales con oído, enlace y transferencia.',
}

export default function EdDrillsPage() {
  return (
    <PageLayout archetype="session" className="layout-stack-md py-6">
      <Link href="/practice" className="inline-flex items-center gap-1.5 rounded py-1 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg focus-ring">
        <ArrowLeft className="size-4" />
        Volver al Hub de Práctica
      </Link>
      <header className="page-header w-full">
        <span className="font-kicker text-primary">Pronunciación · Clusters finales</span>
        <h1 className="font-heading text-h1 font-bold mt-1 text-fg">Escalera de -ed</h1>
        <p className="mt-1 max-w-2xl text-body text-fg-muted">Escucha, enlaza y conserva el pasado regular cuando el entorno se vuelve más difícil.</p>
      </header>
      <main className="w-full"><EdDrillSession /></main>
    </PageLayout>
  )
}
