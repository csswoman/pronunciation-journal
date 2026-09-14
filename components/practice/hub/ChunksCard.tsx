'use client'

// Planned structure:
// <ChunksCard>
//   <Kicker />
//   <Title + description />
//   <ActionLabel />
// </ChunksCard>

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'

export default function ChunksCard() {
  return <Link href="/practice/chunks" onClick={() => void setLastPracticeMode('chunks')} className="group flex h-full flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring"><div><span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">expresiones</span><h2 className="mt-2 text-h3 font-bold text-fg transition-colors group-hover:text-primary">Chunks en contexto</h2><p className="mt-2 text-body-sm text-fg-muted">Aprende bloques frecuentes como una unidad y úsalos en situaciones reales.</p></div><span className="text-body-sm font-semibold text-primary">Practicar chunks →</span></Link>
}
