'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Check } from '@/components/icons'
import Button from '@/components/ui/Button'
import PageHeader from '@/components/layout/PageHeader'
import PageLayout from '@/components/layout/PageLayout'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import {
  deleteTrackingReviewSession,
  loadTrackingReviewSession,
} from '@/lib/tracking/session-store'
import type { TrackingReviewSessionRecord } from '@/lib/db'

export default function TrackingReviewClient({ sessionId }: { sessionId: string | null }) {
  const router = useRouter()
  const { user } = useAuth()
  const [session, setSession] = useState<TrackingReviewSessionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!user || !sessionId) {
      setLoading(false)
      return
    }
    void loadTrackingReviewSession(user.id, sessionId)
      .then((loaded) => {
        if (cancelled) return
        setSession(loaded)
        if (!loaded) setError('Esta sesión de repaso ya no está disponible.')
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos recuperar el repaso guardado.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [sessionId, user?.id])

  async function exitReview() {
    if (user && sessionId) await deleteTrackingReviewSession(user.id, sessionId)
    router.push('/tracking')
  }

  if (loading) {
    return <PageLayout archetype="session"><PageHeader kicker="Tracking" title="Repaso guardado" subtitle="Recuperando tu selección…" /></PageLayout>
  }

  if (!user || !sessionId || !session || error) {
    return (
      <PageLayout archetype="session">
        <PageHeader kicker="Tracking" title="Repaso no disponible" subtitle={error ?? 'Inicia sesión para recuperar esta selección.'} />
        <Button variant="secondary" icon={<ArrowLeft size={16} aria-hidden />} onClick={() => router.push('/tracking')}>
          Volver a Tracking
        </Button>
      </PageLayout>
    )
  }

  const lessonItems = session.queue.items.filter((item) => item.kind === 'lesson' && item.href)

  return (
    <PageLayout archetype="session">
      <PageHeader
        kicker="Tracking"
        title="Repaso guardado"
        subtitle="La sesión conserva exactamente el contenido que elegiste, incluso si vuelves sin conexión."
        secondaryCta={{ label: 'Salir', icon: <ArrowLeft size={15} aria-hidden />, onClick: () => void exitReview(), variant: 'secondary' }}
      />

      {session.queue.skipped.length > 0 ? (
        <div role="status" className="mb-5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken p-4 text-body-sm text-fg-muted">
          Omitimos {session.queue.skipped.length} elemento{session.queue.skipped.length === 1 ? '' : 's'} que ya no tiene{session.queue.skipped.length === 1 ? '' : 'n'} un destino practicable.
        </div>
      ) : null}

      {lessonItems.length > 0 ? (
        <section className="mb-6" aria-labelledby="tracking-review-lessons">
          <h2 id="tracking-review-lessons" className="mb-3 text-body-sm font-semibold text-fg">Lecciones guardadas</h2>
          <div className="space-y-2">
            {lessonItems.map((item) => (
              <Link key={item.id} href={item.href!} className="flex min-h-11 items-center gap-3 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised px-4 py-3 text-body-sm text-fg hover:bg-surface-sunken">
                <BookOpen size={16} aria-hidden className="text-fg-subtle" />
                <span className="min-w-0 truncate">{item.title}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {session.queue.exercises.length > 0 ? (
        <PracticeSession
          context="review"
          exercises={session.queue.exercises}
          sessionLength={session.queue.exercises.length}
          sessionLabel="Contenido guardado"
          onSessionComplete={() => undefined}
          onExit={() => void exitReview()}
        />
      ) : (
        <div className="rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised layout-card-pad text-center">
          <Check size={22} aria-hidden className="mx-auto mb-3 text-fg-muted" />
          <p className="text-body-sm text-fg">No hay ejercicios pendientes en esta selección.</p>
          <Button className="mt-4" variant="secondary" onClick={() => void exitReview()}>Volver a Tracking</Button>
        </div>
      )}
    </PageLayout>
  )
}
