'use client'

// Planned structure:
// <JournalPronunciationCard>
//   <PastelCard tone="coral">
//     <Header: MicIconCircle + Title "Diario de pronunciación" + Subtitle />
//     <PronunciationList: items with word, IPA transcription, and speaker TTS button />
//     <RemainingLink: "Ver 1 más" link text />
//     <FooterButton: "+ Añadir palabra" dark ink pill button />
//   </PastelCard>
// </JournalPronunciationCard>

import { Heart, Volume2 } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import Button from '@/components/ui/Button'
import { speakText } from '@/lib/speech/synthesis'
import type { NotebookTopic } from '@/lib/journal/notebook-types'

export interface VocabularyItem {
  word: string
  meaning: string
}

export const TOPIC_VOCABULARY: Record<NotebookTopic, VocabularyItem[]> = {
  daily: [
    { word: 'overwhelmed', meaning: 'abrumado / desbordado' },
    { word: 'grateful', meaning: 'agradecido / reconfortado' },
    { word: 'relieved', meaning: 'aliviado / tranquilo' },
  ],
  opinion: [
    { word: 'convinced', meaning: 'convencido / seguro' },
    { word: 'skeptical', meaning: 'escéptico / dudoso' },
    { word: 'mindful', meaning: 'consciente / reflexivo' },
  ],
  fiction: [
    { word: 'thrilled', meaning: 'emocionado / entusiasmado' },
    { word: 'shocked', meaning: 'impactado / perplejo' },
    { word: 'determined', meaning: 'decidido / resuelto' },
  ],
  situational: [
    { word: 'eager', meaning: 'deseoso / entusiasmado' },
    { word: 'hesitant', meaning: 'vacilante / con dudas' },
    { word: 'confident', meaning: 'confiado / seguro' },
  ],
  vocab: [
    { word: 'stuck', meaning: 'bloqueado / estancado' },
    { word: 'inspired', meaning: 'inspirado' },
    { word: 'thoughtful', meaning: 'meditativo / atento' },
  ],
  free: [
    { word: 'hopeful', meaning: 'esperanzado' },
    { word: 'nostalgic', meaning: 'nostálgico' },
    { word: 'meaningful', meaning: 'significativo / valioso' },
  ],
}

interface JournalPronunciationCardProps {
  topic?: NotebookTopic
  savedWords?: string[]
  onAddWord?: () => void
  onInsertWord?: (word: string) => void
}

export function JournalPronunciationCard({
  topic = 'daily',
  savedWords = [],
  onAddWord,
  onInsertWord,
}: JournalPronunciationCardProps) {
  const activeTopicWords = TOPIC_VOCABULARY[topic] ?? TOPIC_VOCABULARY.daily

  const items: VocabularyItem[] =
    savedWords.length > 0
      ? savedWords.slice(0, 3).map((w) => {
          const found = activeTopicWords.find(
            (d) => d.word.toLowerCase() === w.toLowerCase()
          )
          return found || { word: w, meaning: 'pensamiento / emoción' }
        })
      : activeTopicWords

  return (
    <PastelCard
      tone="coral"
      className="flex flex-col gap-4 p-5 sm:p-6 overflow-hidden motion-reduce:shadow-none"
      aria-labelledby="pronunciation-card-heading"
    >
      {/* Header con icono y kicker conciso */}
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-coral-deep/70 text-ink shadow-xs"
          aria-hidden="true"
        >
          <Heart className="size-5 text-ink fill-current" aria-hidden />
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span
            id="pronunciation-card-heading"
            className="font-kicker text-kicker sm:text-kicker-lg text-ink select-none"
          >
            VOCABULARIO DE HOY
          </span>
          <p className="font-sans text-caption text-ink-secondary">
            Palabras clave para tu escrito. Toca una para añadirla.
          </p>
        </div>
      </div>

      {/* Lista de palabras de vocabulario con significado en español */}
      <ul className="flex flex-col gap-2.5" role="list">
        {items.map((item) => (
          <li
            key={item.word}
            onClick={() => onInsertWord?.(item.word)}
            className={`flex items-center justify-between gap-3 rounded-2xl bg-coral-soft p-3.5 shadow-2xs transition-all hover:bg-coral-soft/90 ${
              onInsertWord ? 'cursor-pointer' : ''
            }`}
          >
            <div className="flex flex-col gap-0.5 min-w-0 flex-1">
              <span className="font-sans text-body-md sm:text-body-lg font-extrabold text-ink truncate">
                {item.word}
              </span>
              <span className="font-sans text-body-sm text-ink-secondary truncate">
                {item.meaning}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                speakText(item.word)
              }}
              aria-label={`Escuchar pronunciación de ${item.word}`}
              title="Escuchar pronunciación"
              className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-full bg-coral-deep text-ink hover:bg-coral-deep/80 shadow-xs transition-colors cursor-pointer"
            >
              <Volume2 size={16} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      {/* Botón principal inferior */}
      <Button
        type="button"
        variant="ej-ink"
        fullWidth
        onClick={onAddWord}
        className="mt-1"
      >
        + Añadir palabra
      </Button>
    </PastelCard>
  )
}
