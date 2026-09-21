'use client'

// Planned structure:
// <FocusWeekContentGrid>
//   <StoryCard />
//   <GeneratedContentCard />
//   <AvailableContentCard />
// </FocusWeekContentGrid>

import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { KoboyoSlot } from '@/components/illustrations/KoboyoSlot'
import { AlertCircle, ArrowRight, BookOpen, Loader2, MessageCircle, Music, Plus, Sparkles, Target } from '@/components/icons'
import type { FocusContent, FocusContentKind } from '@/lib/focus/types'
import { focusContentSlug } from '@/lib/focus/content-url'

type ContentMeta = {
  label: string
  description: string
  tone: PastelTone
  Icon: typeof BookOpen
}

const CONTENT_META: Record<FocusContentKind, ContentMeta> = {
  story: { label: 'Mini-historia', description: 'Lectura inmersiva con tus focos dentro, ejercicios y microexplicación.', tone: 'sky', Icon: BookOpen },
  drill: { label: 'Drill de frases', description: 'Oraciones guiadas para fijar la estructura sin pensarla.', tone: 'butter', Icon: Target },
  dialogue: { label: 'Diálogo', description: 'Conversación donde el patrón cobra sentido.', tone: 'mint', Icon: MessageCircle },
  error_trap: { label: 'Trampa de errores', description: 'Detecta el fallo frecuente frente al uso correcto.', tone: 'coral', Icon: AlertCircle },
  song: { label: 'Canción o rima', description: 'Cadencia auditiva para retener el patrón más tiempo.', tone: 'lilac', Icon: Music },
}

interface FocusWeekContentGridProps {
  contentList: FocusContent[]
  sprintId: string
  generatingKinds: FocusContentKind[]
  isGeneratingAll: boolean
  onGenerate: (kind: FocusContentKind) => void
  onGenerateAll: () => void
}

type SecondaryContentKind = Exclude<FocusContentKind, 'story'>

function contentHref(_sprintId: string, content: FocusContent) {
  return `/focus/c/${focusContentSlug(content.id)}`
}

export function FocusWeekContentGrid({ contentList, sprintId, generatingKinds, isGeneratingAll, onGenerate, onGenerateAll }: FocusWeekContentGridProps) {
  const story = contentList.find((content) => content.kind === 'story')
  const secondaryKinds: SecondaryContentKind[] = ['drill', 'dialogue', 'error_trap', 'song']

  return (
    <section aria-labelledby="week-content-title">
      <p className="font-kicker text-fg-muted">Contenido de esta semana</p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <h2 id="week-content-title" className="font-display text-h2 text-fg">Para digerir y practicar</h2>
        <Button variant="secondary" size="sm" onClick={onGenerateAll} disabled={generatingKinds.length > 0 || secondaryKinds.every((kind) => contentList.some((content) => content.kind === kind))} isLoading={isGeneratingAll} icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}>
          Generar todo
        </Button>
      </div>
      <p className="mt-2 text-caption text-fg-muted">Generar todos los formatos tarda más porque se crean uno por uno.</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {story ? <StoryCard content={story} sprintId={sprintId} /> : null}
        <div className={story ? 'lg:col-span-1' : 'lg:col-span-3'}>
          <ContentTile kind="drill" content={contentList.find((item) => item.kind === 'drill')} sprintId={sprintId} isGenerating={generatingKinds.includes('drill')} onGenerate={onGenerate} />
        </div>
        {secondaryKinds.slice(1).map((kind) => (
          <ContentTile key={kind} kind={kind} content={contentList.find((item) => item.kind === kind)} sprintId={sprintId} isGenerating={generatingKinds.includes(kind)} onGenerate={onGenerate} />
        ))}
      </div>
    </section>
  )
}

function StoryCard({ content, sprintId }: { content: FocusContent; sprintId: string }) {
  const exercisesCount = content.exercises.length

  return (
    <PastelCard tone="sky" className="lg:col-span-2">
      <div className="grid h-full gap-4 sm:grid-cols-[minmax(0,1fr)_9rem] sm:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge label="Ya generado" variant="neutral" size="sm" />
            <Badge label={`${exercisesCount} ejercicios`} variant="default" size="sm" />
          </div>
          <h3 className="mt-4 font-display text-h2 text-fg">Mini-historia</h3>
          <p className="mt-2 text-body-sm text-fg-muted">Lectura inmersiva con tus focos dentro, ejercicios y microexplicación.</p>
          <Link href={contentHref(sprintId, content)} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-cta-bg px-5 text-body-sm font-bold text-cta-fg transition-transform active:scale-[0.96]">
            Practicar ahora <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <KoboyoSlot name="pupil reading aloud" variant="hero" className="text-fg" />
      </div>
    </PastelCard>
  )
}

function ContentTile({ kind, content, sprintId, isGenerating, onGenerate }: {
  kind: Exclude<FocusContentKind, 'story'>
  content: FocusContent | undefined
  sprintId: string
  isGenerating: boolean
  onGenerate: (kind: FocusContentKind) => void
}) {
  const { label, description, tone, Icon } = CONTENT_META[kind]

  return (
    <PastelCard tone={tone} className="flex h-full flex-col">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-raised text-fg">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-h3 text-fg">{label}</h3>
      <p className="mt-2 flex-1 text-body-sm text-fg-muted">{description}</p>
      {isGenerating ? (
        <div className="mt-5 flex min-h-11 items-center gap-2 text-body-sm font-semibold text-fg" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Generando…
        </div>
      ) : content ? (
        <Link href={contentHref(sprintId, content)} className="focus-ring mt-5 inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-fg px-4 text-body-sm font-bold text-fg transition-transform active:scale-[0.96]">
          Practicar ahora <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <Button variant="secondary" size="sm" className="mt-5 self-start" onClick={() => onGenerate(kind)} icon={<Plus className="h-4 w-4" aria-hidden="true" />}>
          Generar
        </Button>
      )}
    </PastelCard>
  )
}
