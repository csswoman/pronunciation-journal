'use client'

// Planned structure:
// <HomeJournalCard>
//   title + state copy + CTA → /journal
// </HomeJournalCard>

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight } from '@/components/icons'
import { useAuth } from '@/components/auth/AuthProvider'
import { getTodayLocalDateKey } from '@/lib/date/local-date'
import { listLocalJournalEntries } from '@/lib/journal/queries'

function formatShortDate(entryDate: string): string {
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${entryDate}T12:00:00`))
}

function previewText(content: string): string {
  const trimmed = content.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}…` : trimmed
}

/**
 * Quiet aside state for the journal. Writing lives as a plan step daily;
 * this card only reports whether today's entry exists.
 */
export default function HomeJournalCard() {
  const { user } = useAuth()
  const today = getTodayLocalDateKey()

  const entries = useLiveQuery(
    () => (user?.id ? listLocalJournalEntries(user.id, 5) : []),
    [user?.id],
  )

  if (entries === undefined) {
    return (
      <div className="home-sidebar-card flex flex-col gap-2" aria-hidden>
        <div className="h-3 w-14 animate-pulse rounded bg-surface-sunken" />
        <div className="h-4 w-36 animate-pulse rounded bg-surface-sunken" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
      </div>
    )
  }

  const todayEntry = entries.find((e) => e.entryDate === today)
  const lastEntry = entries[0]
  const wroteToday = Boolean(todayEntry && todayEntry.content.trim().length > 0)

  let title: string
  let body: string
  let cta: string
  let href = '/journal'

  if (!lastEntry) {
    title = 'Escribe una entrada breve hoy'
    body = ''
    cta = 'Abrir diario'
  } else if (wroteToday) {
    title = 'Entrada de hoy'
    body = previewText(todayEntry!.content) || 'Ya escribiste hoy.'
    cta = 'Ver entrada'
    href = `/journal/${today}`
  } else {
    title = 'Sin entrada hoy'
    const lastPreview = previewText(lastEntry.content)
    body = lastPreview
      ? `Última: ${formatShortDate(lastEntry.entryDate)} · ${lastPreview}`
      : `Última: ${formatShortDate(lastEntry.entryDate)}`
    cta = 'Escribir ahora'
  }

  return (
    <Link
      href={href}
      className={`home-sidebar-card focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken${!lastEntry ? ' home-sidebar-card--compact' : ''}`}
    >
      <span className="font-label text-fg">Diario</span>
      <span className="font-body-sm text-pretty text-fg">{title}</span>
      {body ? (
        <span className="font-caption line-clamp-2 text-pretty text-fg-muted">{body}</span>
      ) : null}
      <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
        {cta} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  )
}
