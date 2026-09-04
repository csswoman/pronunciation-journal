'use client'

// Planned structure:
// <DailyLessonCard>            // presentational; receives the lesson via props
//   <LessonBody />             // ReactMarkdown of the short body
//   <LessonActions />          // useAICoachStore + TrackingSaveButton + link

import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { ArrowRight, GraduationCap, MessageCircle } from '@/components/icons'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/EmptyState'
import { TrackingSaveButton } from '@/components/tracking/TrackingSaveButton'
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

  if (!lesson) {
    return (
      <section className="rounded-card-interactive border border-border-default bg-surface-raised p-[var(--layout-card-pad)] shadow-sm">
        <EmptyState
          illustration={<EmptyIllustration />}
          title="Hoy no hay lección nueva"
          description="Vuelve mañana para la siguiente mini-lección, o explora la Ruta cuando quieras."
        />
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-card-interactive border border-border-default bg-surface-raised p-[var(--layout-card-pad)] shadow-sm">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-primary">
          <GraduationCap className="size-4" />
          <span className="font-kicker text-fg-muted">La lección de hoy</span>
        </div>
        <h2 className="text-h3 font-bold text-fg">{lesson.title}</h2>
        <p className="text-body-sm text-fg-muted">{lesson.subtitle}</p>
      </header>

      <div className="flex flex-col gap-2 text-body-sm text-fg leading-relaxed">
        <ReactMarkdown>{lesson.body}</ReactMarkdown>
      </div>

      <footer className="flex flex-wrap items-center gap-2 border-t border-border-default/60 pt-3">
        <Link href={`/mini-lessons/${lesson.slug}`}>
          <Button variant="primary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
            Ver lección completa
          </Button>
        </Link>

        <TrackingSaveButton
          kind="lesson"
          reference={lesson.slug}
          title={lesson.title}
          payload={{ href: `/mini-lessons/${lesson.slug}` }}
        />

        <Button
          variant="ghost"
          size="sm"
          icon={<MessageCircle size={14} />}
          onClick={() =>
            openCoach({ tab: 'chat', prefill: `Explícame más sobre "${lesson.title}"` })
          }
        >
          Pregúntale al coach
        </Button>
      </footer>
    </section>
  )
}
