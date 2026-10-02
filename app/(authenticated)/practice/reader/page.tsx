import type { Metadata } from 'next'
import PageLayout from '@/components/layout/PageLayout'
import { ReaderEntry } from '@/components/practice/reader/ReaderEntry'

export const metadata: Metadata = {
  title: 'Lectura Guiada y Contextual | English Journal',
  description: 'Lecturas comprensibles adaptadas a tu nivel con práctica de shadowing y comprensión lectora.',
}

export default function ReaderPage() {
  return (
    <PageLayout archetype="catalog" className="layout-stack-md py-6">
      <main className="w-full">
        <ReaderEntry />
      </main>
    </PageLayout>
  )
}

