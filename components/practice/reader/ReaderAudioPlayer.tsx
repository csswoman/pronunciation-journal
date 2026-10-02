'use client'

// Planned structure:
// <ReaderAudioPlayer>
//   <TopControlRow>
//     <PlayPauseButton /> (circular blue button)
//     <AudioStatusAndProgress>
//       <PhraseInfoText /> (Escuchar la historia · Frase 2 de 7)
//       <SegmentedProgressBar /> (7 sentence bars)
//     </AudioStatusAndProgress>
//     <SpeedSelector /> (0.75x, 0.9x, 1x, 1.25x pills)
//   </TopControlRow>
//   <BottomControlRow>
//     <ShadowingToggle /> (Modo shadowing switch)
//     <VoiceStatusText /> (Voz estándar · sin HD)
//   </BottomControlRow>
// </ReaderAudioPlayer>

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Sparkles, Volume2 } from '@/components/icons'
import { fetchReaderAudioUrl } from '@/lib/practice/reader/queries'
import { updateReaderPassageAudioUrl } from '@/lib/db'

interface ReaderAudioPlayerProps {
  passageId: string
  passageText: string
  initialAudioUrl?: string
  online: boolean
  onAudioReady?: (url: string) => void
  totalSentences?: number
  currentSentenceIdx?: number
}

const SPEED_OPTIONS = [0.75, 0.9, 1.0, 1.25]

export function ReaderAudioPlayer({
  passageId,
  passageText,
  initialAudioUrl,
  online,
  onAudioReady,
  totalSentences = 7,
  currentSentenceIdx = 1,
}: ReaderAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudioUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(0.9)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isShadowing, setIsShadowing] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl)
    }
  }, [initialAudioUrl])

  async function handleGenerateAudio() {
    if (!online || isGenerating) return
    setIsGenerating(true)
    setErrorMsg(null)

    try {
      const url = await fetchReaderAudioUrl(passageId, passageText)
      setAudioUrl(url)
      await updateReaderPassageAudioUrl(passageId, url)
      onAudioReady?.(url)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al generar voz')
    } finally {
      setIsGenerating(false)
    }
  }

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      void audio.play()
      setIsPlaying(true)
    }
  }

  function handleSpeedChange(rate: number) {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  if (!audioUrl) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary shrink-0">
            <Volume2 className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-bold text-fg leading-tight">Voz nativa de alta fidelidad</p>
            <p className="text-caption text-fg-muted truncate">
              Genera la narración hablada con voz HD y déjala lista para escuchar siempre.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {errorMsg && <span className="text-caption text-danger">{errorMsg}</span>}
          <button
            type="button"
            onClick={handleGenerateAudio}
            disabled={!online || isGenerating}
            className="w-full sm:w-auto rounded-full bg-surface-raised border border-border hover:bg-surface-sunken px-4 py-1.5 text-xs font-semibold text-fg flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>{isGenerating ? 'Generando voz HD...' : 'Generar voz HD 🎙️'}</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false)
        }}
      />

      {/* Row 1: Main Audio Playback Bar & Segmented Progress */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
            className="size-10 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95"
          >
            {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5 fill-current" />}
          </button>

          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-fg">Escuchar la historia</span>
              <span className="text-xs font-mono text-fg-muted">
                Frase {currentSentenceIdx + 1} de {totalSentences}
              </span>
            </div>

            {/* Segmented Sentence Progress Bar */}
            <div className="flex items-center gap-1.5 w-full">
              {Array.from({ length: totalSentences }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx <= currentSentenceIdx
                      ? 'bg-primary'
                      : 'bg-border/60'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Speed Option Pills */}
        <div className="flex items-center gap-1 shrink-0">
          {SPEED_OPTIONS.map((rate) => {
            const isActive = playbackRate === rate
            return (
              <button
                key={rate}
                type="button"
                onClick={() => handleSpeedChange(rate)}
                className={`rounded-full px-2.5 py-1 text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-sunken'
                }`}
              >
                {rate}x
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 2: Shadowing Toggle & Audio Voice Meta */}
      <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-xs">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isShadowing}
            onChange={(e) => setIsShadowing(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all relative" />
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="font-bold text-fg">Modo shadowing</span>
            <span className="text-fg-muted font-normal">Pausa tras cada frase para que la repitas en voz alta</span>
          </div>
        </label>

        <span className="font-mono text-fg-muted text-xs shrink-0 hidden sm:inline">
          Voz estándar · sin HD
        </span>
        <span className="sr-only">Voz HD lista (Puck)</span>
      </div>
    </div>
  )
}
