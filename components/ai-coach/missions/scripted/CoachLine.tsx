'use client'

// Planned structure:
// <CoachLine>
//   <CoachHeaderRow> — Role avatar + Role title + Hablando pill badge
//   <CoachCardContainer>
//     <SpokenLine /> — Spoken line text with active word yellow highlight
//     <TranslationBox /> — Translated text if toggled
//     <CoachActionToolbar> — Escuchar, 0.5x, Traducir + Continuar CTA button
//   </CoachCardContainer>
// </CoachLine>

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLinePlayback } from '@/hooks/useLinePlayback'
import { PillButton } from '@/components/ui/PillButton'
import { ArrowRight, Languages, Volume2 } from '@/components/icons'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import { SpokenLine } from './SpokenLine'
import { speakPhrase } from '@/lib/ai-coach/pronunciation'
import { cn } from '@/lib/cn'

interface Props {
  line: ScriptLine
  onContinue: () => void
  missionId?: string
  speakerRole?: string
}

export function CoachLine({ line, onContinue, missionId, speakerRole = 'Entrevistadora' }: Props) {
  const autoplayedRef = useRef<string | null>(null)
  const playback = useLinePlayback(line, missionId)
  const { play } = playback

  const [isSlow, setIsSlow] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [translationText, setTranslationText] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    if (autoplayedRef.current === line.id) return
    autoplayedRef.current = line.id
    play()
  }, [line.id, play])

  const handleSlowPlay = useCallback(() => {
    setIsSlow((prev) => !prev)
    speakPhrase(line.text, 0.55)
  }, [line.text])

  const handleToggleTranslation = useCallback(async () => {
    if (showTranslation) {
      setShowTranslation(false)
      return
    }

    setShowTranslation(true)
    if (translationText || isTranslating) return

    setIsTranslating(true)
    try {
      const res = await fetch('/api/gemini/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: line.text }),
      })
      if (res.ok) {
        const data = (await res.json()) as { translation?: string }
        if (data.translation) {
          setTranslationText(data.translation)
        }
      }
    } catch {
      // Ignorar error de traducción
    } finally {
      setIsTranslating(false)
    }
  }, [line.text, showTranslation, translationText, isTranslating])

  return (
    <div className="flex flex-col items-start gap-2.5 w-full animate-message-in">
      {/* Header Row: Role avatar + Role name + Active speaking status */}
      <div className="flex items-center gap-2.5">
        <span className="size-7 rounded-full bg-purple-200 text-purple-950 dark:bg-purple-900/80 dark:text-purple-200 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs font-mono uppercase">
          HR
        </span>
        <span className="font-display font-bold text-fg text-sm sm:text-base tracking-tight">
          {speakerRole}
        </span>

        {playback.isPlaying && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold animate-pulse">
            <Volume2 size={13} aria-hidden /> Hablando…
          </span>
        )}
      </div>

      {/* Main Coach Chat Bubble Container */}
      <div className="w-full rounded-3xl border border-border-subtle bg-surface-raised p-5 sm:p-6 shadow-sm space-y-4 font-sans">
        {/* Large spoken text */}
        <h3 className="m-0 font-display text-xl sm:text-2xl @[28rem]:text-3xl font-extrabold text-fg leading-relaxed tracking-tight">
          <SpokenLine text={line.text} activeIndex={playback.activeIndex} />
        </h3>

        {/* Translation Box */}
        {showTranslation && (
          <div className="pt-3 border-t border-border-subtle/80 text-xs text-fg-muted">
            <span className="font-semibold text-xxs uppercase tracking-wider text-primary block mb-0.5">
              Traducción
            </span>
            <p className="m-0 text-pretty text-body-sm text-fg leading-relaxed">
              {isTranslating ? 'Traduciendo…' : (translationText || 'Cargando traducción…')}
            </p>
          </div>
        )}

        {/* Bottom Action Bar inside card */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border-subtle/50">
          <div className="flex flex-wrap items-center gap-2">
            <PillButton
              type="button"
              variant="outline"
              size="sm"
              onClick={playback.play}
              disabled={playback.isPlaying}
              aria-label="Repetir audio"
              icon={<Volume2 size={14} className={playback.isPlaying ? 'animate-bounce' : ''} />}
              className="!bg-surface-sunken !border-border-subtle !text-fg hover:!bg-surface-base font-medium text-xs rounded-full px-3.5 py-1.5 min-h-9"
            >
              {playback.isPlaying ? 'Reproduciendo…' : 'Escuchar'}
            </PillButton>

            <PillButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSlowPlay}
              className={cn(
                'font-mono text-xs rounded-full px-3 py-1.5 min-h-9 transition-colors',
                isSlow
                  ? '!bg-primary/20 !border-primary !text-primary font-bold'
                  : '!bg-surface-sunken !border-border-subtle !text-fg-muted hover:!text-fg',
              )}
            >
              0.5×
            </PillButton>

            <PillButton
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleTranslation}
              icon={<Languages size={14} />}
              className="!bg-surface-sunken !border-border-subtle !text-fg-muted hover:!text-fg font-medium text-xs rounded-full px-3.5 py-1.5 min-h-9"
            >
              {showTranslation ? 'Ver inglés' : 'Traducir'}
            </PillButton>
          </div>

          <PillButton
            type="button"
            variant="primary"
            size="sm"
            onClick={onContinue}
            icon={<ArrowRight size={15} />}
            iconPosition="right"
            className="!bg-primary !text-white hover:!bg-primary-hover font-semibold text-xs rounded-full px-5 py-2 min-h-9 shadow-xs transition-transform duration-150 active:scale-95 ml-auto"
          >
            Continuar
          </PillButton>
        </div>
      </div>
    </div>
  )
}
