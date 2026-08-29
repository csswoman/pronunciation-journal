import Link from 'next/link'
import { BookOpen, Volume2, BrainCircuit } from "@/components/icons"

import type { SkillProfileData, CoachInsights } from '@/lib/progress/queries'

import {
  ProgressCard,
  ProgressCardHeader,
  ProgressStatBar,
  ProgressBigNumber,
} from './ProgressCard'

interface Props {
  data: SkillProfileData
  coach: CoachInsights
}

const STATUS_CONFIG: {
  key: 'new' | 'learning' | 'review' | 'mastered'
  label: string
  color: string
}[] = [
  { key: 'new', label: 'Nuevas', color: 'var(--border-subtle)' },
  { key: 'learning', label: 'En aprendizaje', color: 'var(--warning)' },
  { key: 'review', label: 'En repaso', color: 'color-mix(in oklch, var(--primary) 75%, transparent)' },
  { key: 'mastered', label: 'Dominadas', color: 'var(--primary)' },
]

function SoundLabPanel({ phonemes }: { phonemes: SkillProfileData['weakestPhonemes'] }) {
  if (phonemes.length === 0) {
    return (
      <ProgressCard>
        <ProgressCardHeader icon={<Volume2 size={16} />} eyebrow="Sound Lab" title="Sonidos a reforzar" />
        <p className="text-caption text-fg-muted">
          Practica ejercicios de fonemas para ver tus sonidos a reforzar.
        </p>
      </ProgressCard>
    )
  }

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<Volume2 size={16} />} eyebrow="Sound Lab" title="Sonidos a reforzar" />
      {phonemes.slice(0, 3).map((p) => (
        <ProgressStatBar
          key={p.ipa}
          label={`/${p.ipa}/`}
          value={p.accuracy}
          barColor={
            p.accuracy >= 80 ? 'var(--success)' : p.accuracy >= 70 ? 'var(--primary)' : 'var(--warning)'
          }
          labelClassName="font-ipa text-primary"
        />
      ))}
      <Link href="/practice" className="mt-1 inline-flex min-h-[36px] items-center text-caption font-semibold text-primary transition-opacity hover:opacity-80 focus-ring">
        Practicar estos sonidos →
      </Link>
    </ProgressCard>
  )
}

function LexiconPanel({
  wordsByStatus,
  core1000Practiced,
  lessonsCompleted,
}: {
  wordsByStatus: SkillProfileData['wordsByStatus']
  core1000Practiced: number
  lessonsCompleted: number
}) {
  const total = wordsByStatus.new + wordsByStatus.learning + wordsByStatus.review
    + wordsByStatus.mastered + (wordsByStatus.legacyMastered ?? 0)
  const mastered = wordsByStatus.mastered
  const masteredPct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const toReview = wordsByStatus.review + wordsByStatus.learning
  const needsVerification = wordsByStatus.legacyMastered ?? 0

  if (total === 0 && core1000Practiced === 0 && lessonsCompleted === 0) {
    return (
      <ProgressCard>
        <ProgressCardHeader icon={<BookOpen size={16} />} eyebrow="Diccionario" title="Vocabulario" />
        <p className="text-caption text-fg-muted">Sin palabras en tu banco aún.</p>
      </ProgressCard>
    )
  }

  const topStatuses = STATUS_CONFIG.filter((s) => wordsByStatus[s.key] > 0).slice(0, 3)

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<BookOpen size={16} />} eyebrow="Diccionario" title="Vocabulario" />
      {total > 0 && (
        <>
          <div className="mt-1 flex gap-[var(--layout-stack-loose)]">
            <ProgressBigNumber value={`${masteredPct}%`} sub={`dominadas · ${mastered}/${total}`} />
            <ProgressBigNumber value={toReview} sub="por repasar" tone={toReview > 0 ? 'warning' : 'primary'} />
          </div>
          <div className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            {STATUS_CONFIG.map(({ key, color }) => {
              const pct = total > 0 ? (wordsByStatus[key] / total) * 100 : 0
              if (pct === 0) return null
              return <div key={key} style={{ width: `${pct}%`, background: color }} />
            })}
          </div>
          {topStatuses.map(({ key, label, color }) => {
            const count = wordsByStatus[key]
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return <ProgressStatBar key={key} label={label} value={pct} barColor={color} />
          })}
          {needsVerification > 0 && (
            <p className="mt-3 text-caption text-warning">
              {needsVerification} marcadas como dominadas sin evidencia reciente — vuelve a repasarlas.
            </p>
          )}
        </>
      )}
      {(core1000Practiced > 0 || lessonsCompleted > 0) && (
        <div className="mt-3 flex gap-[var(--layout-stack-loose)] border-t border-[var(--line-divider)] pt-3">
          {core1000Practiced > 0 && (
            <ProgressBigNumber value={core1000Practiced} sub="palabras clave" />
          )}
          {lessonsCompleted > 0 && (
            <ProgressBigNumber value={lessonsCompleted} sub="lecciones hechas" />
          )}
        </div>
      )}
      <Link href="/words" className="mt-1 inline-flex min-h-[36px] items-center text-caption font-semibold text-primary transition-opacity hover:opacity-80 focus-ring">
        Abrir diccionario →
      </Link>
    </ProgressCard>
  )
}

function CoachInsightsPanel({ coach }: { coach: CoachInsights }) {
  const hasData = coach.weakTopics.length > 0 || coach.cefrEstimate !== null || coach.profileLevel !== null

  if (!hasData) {
    return (
      <ProgressCard>
        <ProgressCardHeader icon={<BrainCircuit size={16} />} eyebrow="AI Coach" title="Diagnóstico de gramática" />
        <p className="text-caption text-fg-muted">
          Chatea con el AI Coach para estructurar tu perfil de gramática.
        </p>
      </ProgressCard>
    )
  }

  // Un solo nivel: el estimado por el coach manda; si no, el declarado en el perfil.
  const level = coach.cefrEstimate ?? coach.profileLevel
  const levelSub =
    coach.cefrEstimate && coach.profileLevel && coach.cefrEstimate !== coach.profileLevel
      ? `nivel estimado · perfil ${coach.profileLevel}`
      : coach.cefrEstimate
        ? 'nivel estimado'
        : 'nivel actual'

  return (
    <ProgressCard>
      <ProgressCardHeader icon={<BrainCircuit size={16} />} eyebrow="AI Coach" title="Diagnóstico de gramática" />
      {level && (
        <div className="mt-1 mb-3">
          <ProgressBigNumber value={level} sub={levelSub} />
        </div>
      )}
      {coach.weakTopics.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="font-kicker font-medium text-fg-muted">Temas a reforzar</p>
          {coach.weakTopics.map((t) => (
            <ProgressStatBar
              key={t.topic}
              label={t.topic}
              value={Math.round(t.errorRate * 100)}
              barColor="var(--warning)"
            />
          ))}
        </div>
      )}
      <Link href="/practice/decks" className="mt-1 inline-flex min-h-[36px] items-center text-caption font-semibold text-primary transition-opacity hover:opacity-80 focus-ring">
        Practicar estos temas →
      </Link>
    </ProgressCard>
  )
}

export function SkillProfileCard({ data, coach }: Props) {
  const hasAnyData =
    Object.values(data.wordsByStatus).some((v) => v > 0) ||
    data.weakestPhonemes.length > 0 ||
    data.core1000Practiced > 0 ||
    data.lessonsCompleted > 0 ||
    coach.weakTopics.length > 0 ||
    coach.cefrEstimate !== null ||
    coach.profileLevel !== null

  if (!hasAnyData) {
    return (
      <ProgressCard>
        <p className="text-base font-medium text-fg">Dónde enfocar</p>
        <p className="text-body-sm text-fg-muted">
          Añade palabras y practica fonemas para construir tu perfil.
        </p>
      </ProgressCard>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-medium text-fg">Dónde enfocar</h2>
        <p className="text-caption text-fg-muted">
          El detalle de las tres dimensiones con más margen de mejora.
        </p>
      </div>
      <div className="dashboard-grid-3">
        <SoundLabPanel phonemes={data.weakestPhonemes} />
        <LexiconPanel
          wordsByStatus={data.wordsByStatus}
          core1000Practiced={data.core1000Practiced}
          lessonsCompleted={data.lessonsCompleted}
        />
        <CoachInsightsPanel coach={coach} />
      </div>
    </section>
  )
}
