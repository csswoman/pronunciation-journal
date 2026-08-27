'use client'

// Planned structure:
// <ExerciseCard>
//   <CardHeader>
//     <IconBadge />
//     <SkillBadge />
//   </CardHeader>
//   <CardContent>
//     <Title />
//     <Slug />
//   </CardContent>
//   <CardActions>
//     <LaunchButton />
//     <SplitButton />
//   </CardActions>
// </ExerciseCard>

import type { ComponentType } from 'react'
import {
  CheckSquare,
  Columns2,
  Ear,
  Eye,
  FileText,
  GitCompareArrows,
  Grid2x2,
  Headphones,
  ListOrdered,
  Mic,
  Pencil,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  Volume2,
  Waves,
  type AppIconProps,
} from '@/components/icons'
import { cn } from '@/lib/cn'
import type { TestGalleryEntry } from '@/lib/practice/test-gallery/fixtures'

interface Props {
  entry: TestGalleryEntry
  active?: boolean
  canSplit: boolean
  onSelect: (entry: TestGalleryEntry, mode: 'single' | 'split') => void
}

const EXERCISE_ICONS: Record<string, ComponentType<AppIconProps>> = {
  fill_blank: Pencil,
  sentence_dictation: Headphones,
  match_pairs: GitCompareArrows,
  reorder_words: ListOrdered,
  sentence_context: FileText,
  multiple_choice: CheckSquare,
  written_production: Pencil,
  spoken_production: Mic,
  error_correction: Sparkles,
  conjugation_blank: Pencil,
  sentence_transformation: RefreshCw,
  translation_es_en: GitCompareArrows,
  cs_shadow_phrase: Waves,
  pick_word: CheckSquare,
  pick_sound: Ear,
  minimal_pair: GitCompareArrows,
  dictation: Volume2,
  speak_word: Mic,
  identify: Eye,
  ax_same_different: GitCompareArrows,
  odd_one_out: Target,
  abx: Grid2x2,
}

const SKILL_BADGES: Record<string, string> = {
  fill_blank: 'Léxico',
  sentence_dictation: 'Escucha & Escritura',
  match_pairs: 'Asociación',
  reorder_words: 'Sintaxis',
  sentence_context: 'Lectura contextual',
  multiple_choice: 'Gramática',
  written_production: 'Escritura libre',
  spoken_production: 'Producción oral',
  error_correction: 'Corrección',
  conjugation_blank: 'Morfología',
  sentence_transformation: 'Sintaxis activa',
  translation_es_en: 'Traducción',
  cs_shadow_phrase: 'Habla conectada',
  pick_word: 'Reconocimiento',
  pick_sound: 'Percepción',
  minimal_pair: 'Pares mínimos',
  dictation: 'Transcripción',
  speak_word: 'Pronunciación',
  identify: 'Identificación',
  ax_same_different: 'Discriminación AX',
  odd_one_out: 'El intruso',
  abx: 'Discriminación ABX',
}

export function ExerciseCard({ entry, active = false, canSplit, onSelect }: Props) {
  const Icon = EXERCISE_ICONS[entry.slug] ?? Play
  const skill = SKILL_BADGES[entry.slug] ?? 'Práctica'

  return (
    <div
      className={cn(
        'group flex flex-col justify-between gap-3 rounded-lg border bg-surface-raised p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/40',
        active
          ? 'border-primary/50 ring-2 ring-primary/30'
          : 'border-border-subtle hover:border-border-default',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-muted transition-colors group-hover:bg-primary-soft group-hover:text-primary">
          <Icon size={18} aria-hidden />
        </div>
        <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-caption text-tiny font-medium text-fg-subtle">
          {skill}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <h3 className="text-body-sm font-semibold text-fg group-hover:text-primary transition-colors">
          {entry.label}
        </h3>
        <p className="font-mono text-tiny text-fg-subtle">{entry.slug}</p>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSelect(entry, 'single')}
          className="focus-ring flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-sunken px-3 py-1.5 text-caption font-semibold text-fg transition-all duration-150 hover:bg-primary hover:text-on-primary active:scale-[0.98]"
        >
          <Play size={13} aria-hidden />
          <span>Probar</span>
        </button>

        {canSplit ? (
          <button
            type="button"
            onClick={() => onSelect(entry, 'split')}
            title="Comparar en vista dividida (Split)"
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-md border border-border-default bg-surface-base text-fg-muted transition-all duration-150 hover:border-border-strong hover:bg-surface-sunken hover:text-fg active:scale-95"
            aria-label={`Comparar ${entry.label} en vista dividida`}
          >
            <Columns2 size={14} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
