'use client'

import { useState } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Bookmark, BookmarkCheck, MessageCircle } from '@/components/icons'
import Chip from '@/components/ui/Chip'
import PastelCard from '@/components/layout/PastelCard'
import EmptyState from '@/components/EmptyState'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { getIllustration } from '@/lib/illustrations/registry'

const EmptyIllustration = getIllustration('emptyDeck')

interface DailyLessonCardProps {
  lesson: {
    slug: string
    title: string
    subtitle: string
    body: string
  } | null
}

export default function DailyLessonCard({ lesson }: DailyLessonCardProps) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const [saved, setSaved] = useState(false)

  if (!lesson) {
    return (
      <PastelCard tone="butter" className="p-5 sm:p-6 motion-reduce:shadow-none">
        <EmptyState
          illustration={<EmptyIllustration />}
          title="Hoy no hay lección nueva"
          description="Vuelve mañana para la siguiente mini-lección, o explora la Ruta cuando quieras."
        />
      </PastelCard>
    )
  }

  return (
    <PastelCard tone="butter" className="relative flex flex-col gap-4.5 p-6 sm:p-7 overflow-hidden motion-reduce:shadow-none">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip variant="ink" className="uppercase tracking-wide font-extrabold px-3 py-1">
            LA LECCIÓN DE HOY
          </Chip>
          <Chip variant="outline" className="border-ink/20 text-ink-secondary px-3 py-1 font-medium">
            4 min de lectura
          </Chip>
        </div>
        <h2 className="font-heading text-h1 font-extrabold text-ink text-balance tracking-tight">
          {lesson.title}
        </h2>
        {lesson.subtitle ? (
          <p className="font-ipa text-body-md font-bold text-ink-secondary">
            {lesson.subtitle}
          </p>
        ) : null}
      </header>

      <div className="flex flex-col gap-2 font-body-sm text-ink leading-relaxed">
        <ReactMarkdown>{lesson.body}</ReactMarkdown>
      </div>

      {/* Ejemplos destacados en contención suave */}
      <div className="relative flex flex-wrap items-center gap-3 rounded-full bg-paper/60 border border-ink/10 px-4 py-2.5 text-body-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-paper px-3.5 py-1 font-sans font-medium text-ink">
            cats <span className="font-ipa font-bold text-ink-secondary">/s/</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-paper px-3.5 py-1 font-sans font-medium text-ink">
            dogs <span className="font-ipa font-bold text-ink-secondary">/z/</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/30 bg-paper px-3.5 py-1 font-sans font-medium text-ink">
            watches <span className="font-ipa font-bold text-ink-secondary">/ɪz/</span>
          </span>
        </div>
      </div>

      {/* Rayas decorativas por fuera en la esquina inferior derecha de la tarjeta */}
      <div className="absolute -bottom-1 -right-1 opacity-25 select-none pointer-events-none text-ink" aria-hidden="true">
        <svg width="160" height="80" viewBox="0 0 160 80" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M100 20 C120 8 140 12 135 28 C130 40 115 32 128 20" />
          <path d="M15 65 C55 48 95 72 150 42" />
        </svg>
      </div>

      <footer className="flex flex-wrap items-center gap-3 pt-2">
        <Link
          href={`/mini-lessons/${lesson.slug}`}
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-2.5 font-label text-body-sm font-bold text-paper transition-colors hover:bg-ink-secondary cursor-pointer shadow-xs"
        >
          Ver la lección
        </Link>

        <button
          type="button"
          onClick={() => setSaved(!saved)}
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 font-label text-body-sm font-bold text-ink transition-colors cursor-pointer ${
            saved ? 'bg-ink text-paper' : 'bg-transparent hover:bg-ink/10'
          }`}
        >
          {saved ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
          <span>{saved ? 'Guardada' : 'Guardar'}</span>
        </button>

        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill: `Explícame más sobre "${lesson.title}"` })}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-full border-2 border-ink bg-transparent px-5 py-2.5 font-label text-body-sm font-bold text-ink transition-colors hover:bg-ink/10 cursor-pointer"
        >
          <MessageCircle size={16} aria-hidden />
          <span>Preguntar al coach</span>
        </button>
      </footer>
    </PastelCard>
  )
}
