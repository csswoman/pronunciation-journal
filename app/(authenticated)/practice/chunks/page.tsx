import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from '@/components/icons'
import PageLayout from '@/components/layout/PageLayout'
import { ChunkPracticeClient } from '@/components/practice/chunks/ChunkPracticeClient'

export const metadata: Metadata = { title: 'Practicar chunks | English Journal', description: 'Practica expresiones frecuentes en contexto con escucha, recuperación y producción.' }

export default function ChunksPracticePage() {
  return <PageLayout archetype="session" className="layout-stack-md py-6"><Link href="/practice" className="focus-ring inline-flex w-fit items-center gap-1.5 rounded py-1 text-body-sm font-medium text-fg-muted transition-colors hover:text-fg"><ArrowLeft className="size-4" aria-hidden />Volver a Práctica</Link><main className="w-full"><ChunkPracticeClient /></main></PageLayout>
}
