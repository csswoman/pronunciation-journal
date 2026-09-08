import React from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import type { FocusContent, FocusContentKind } from '@/lib/focus/types'

interface FocusContentCardProps {
  content: FocusContent
  sprintId: string
}

const KIND_METADATA: Record<FocusContentKind, { label: string; icon: string; description: string }> = {
  story: {
    label: 'Mini-Historia',
    icon: '📖',
    description: 'Lectura inmersiva contextual con ejercicios y microexplicación.',
  },
  drill: {
    label: 'Drill de Frases',
    icon: '🎯',
    description: 'Repetición deliberada del patrón con traducciones y huecos.',
  },
  dialogue: {
    label: 'Diálogo',
    icon: '💬',
    description: 'Conversación real en contexto cotidiano o laboral.',
  },
  error_trap: {
    label: 'Trampa de Errores',
    icon: '⚡',
    description: 'Entrena tu ojo identificando errores fósiles comunes.',
  },
  song: {
    label: 'Canción / Rima',
    icon: '🎵',
    description: 'Práctica rítmica para interiorizar cadencia y patrón.',
  },
}

export function FocusContentCard({ content, sprintId }: FocusContentCardProps) {
  const meta = KIND_METADATA[content.kind]
  const exercisesCount = content.exercises?.length ?? 0
  const hasAudio = Boolean(content.media.audioNarrationUrl)
  const hasImage = Boolean(content.media.imageSceneUrl)

  return (
    <Link
      href={`/focus/${sprintId}/${content.kind}/${content.id}`}
      className="block p-5 rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] hover:border-[var(--border-hover)] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label={meta.label}>
            {meta.icon}
          </span>
          <h4 className="text-body font-semibold text-[var(--text-primary)]">
            {meta.label}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {hasAudio && <Badge label="Audio" variant="info" size="sm" />}
          {hasImage && <Badge label="Imagen" variant="neutral" size="sm" />}
          <Badge label={`${exercisesCount} ejercicios`} variant="success" size="sm" />
        </div>
      </div>

      <p className="text-body-sm text-[var(--text-secondary)] mb-4">
        {meta.description}
      </p>

      <div className="text-tiny font-medium text-[var(--primary)] flex items-center gap-1">
        Practicar ahora →
      </div>
    </Link>
  )
}
