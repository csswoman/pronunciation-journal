'use client'

// Planned structure:
// <NotebookTodayPromptHeader>
//   <MetaRow: "PÁGINA DE HOY" + high-contrast date tag + high-contrast Shuffle button />
//   <QuestionBlock: QuestionEn + SpeakerAudioButton next to text + QuestionEs />
//   <KoboyoIllustrationSVG: clean illustration SVG without label/dashed box />
// </NotebookTodayPromptHeader>

import { RefreshCw, Volume2 } from '@/components/icons'
import { getIllustration, type IllustrationKey } from '@/lib/illustrations/registry'
import { speakText } from '@/lib/speech/synthesis'

const VARIED_ILLUSTRATION_KEYS: IllustrationKey[] = [
  'journalPhraseBook',
  'journalLanguageBook',
  'journalBlankBoard',
  'domainWriting',
  'domainReading',
  'domainVocabulary',
  'domainSpeaking',
  'stateWin',
]

function getDynamicIllustrationKey(promptText: string): IllustrationKey {
  let hash = 0
  for (let i = 0; i < promptText.length; i++) {
    hash = (hash << 5) - hash + promptText.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % VARIED_ILLUSTRATION_KEYS.length
  return VARIED_ILLUSTRATION_KEYS[index]
}

interface NotebookTodayPromptHeaderProps {
  date: string
  formattedDate: string
  promptEn: string
  promptEs: string
  onShufflePrompt?: () => void
}

export function NotebookTodayPromptHeader({
  date,
  formattedDate,
  promptEn,
  promptEs,
  onShufflePrompt,
}: NotebookTodayPromptHeaderProps) {
  const illustrationKey = getDynamicIllustrationKey(promptEn)
  const IllustrationComponent = getIllustration(illustrationKey)

  return (
    <div className="flex flex-col gap-5">
      {/* ── Fila Meta con alto contraste ── */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 font-sans text-caption font-bold text-paper select-none shadow-2xs">
            PÁGINA DE HOY
          </span>
          <span className="inline-flex items-center rounded-full bg-mint-deep/70 px-3.5 py-1 font-sans text-caption font-semibold text-ink select-none">
            <time dateTime={date} suppressHydrationWarning>{formattedDate}</time>
          </span>
        </div>

        <button
          type="button"
          onClick={onShufflePrompt}
          aria-label="Cambiar tema"
          title="Cambiar tema"
          className="focus-ring rounded-full bg-mint-deep/60 hover:bg-mint-deep text-ink p-2.5 transition-all cursor-pointer select-none"
        >
          <RefreshCw size={18} aria-hidden />
        </button>
      </div>

      {/* ── Pregunta principal con botón de audio grande e ilustración Koboyo ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <h2
            id="today-page-heading"
            className="font-heading text-h2 sm:text-h1 font-extrabold text-ink leading-tight text-balance"
          >
            {promptEn}
          </h2>

          <p className="font-sans text-body-md font-medium text-ink-secondary leading-normal">
            {promptEs}
          </p>
        </div>

        {/* Reproductor de audio (Botón circular negro grande) */}
        <button
          type="button"
          onClick={() => speakText(promptEn)}
          aria-label={`Escuchar pronunciación de ${promptEn}`}
          title="Escuchar tema"
          className="focus-ring inline-flex size-14 shrink-0 items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-secondary transition-all cursor-pointer select-none shadow-xs my-auto"
        >
          <Volume2 size={24} aria-hidden />
        </button>

        {/* Ilustración de Koboyo (limpia, sin texto ni borde) */}
        <div className="shrink-0 self-start sm:self-center p-1 text-ink select-none hidden sm:block">
          <IllustrationComponent className="h-16 sm:h-20 w-auto text-ink" aria-hidden />
        </div>
      </div>
    </div>
  )
}
