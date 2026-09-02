// Planned structure:
// <ReferenceSection> — "Diccionario" bento card (kicker consulta, subtitle, quick search bar)

import Link from 'next/link'
import { Search } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'

export default function ReferenceSection() {
  return (
    <Link
      href="/words"
      onClick={() => void setLastPracticeMode('dictionary')}
      className="group flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-colors hover:border-border-strong focus-ring h-full"
    >
      <div className="flex flex-col gap-3">
        <span className="font-kicker text-fg-subtle text-tiny">consulta</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Diccionario
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Significados, IPA y pistas en todo el catálogo.
          </p>
        </div>
      </div>

      <div className="pt-2">
        <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-sunken/80 px-3 py-2 text-caption text-fg-muted transition-colors group-hover:border-border-default">
          <Search size={14} className="text-fg-subtle" aria-hidden />
          <span>Busca una palabra</span>
        </div>
      </div>
    </Link>
  )
}


