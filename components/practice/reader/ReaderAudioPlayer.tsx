'use client'

// Planned structure:
// <ReaderAudioPlayer>
//   <AudioGeneratePrompt />  (when audioUrl is absent)
//   <AudioControlsBar />     (when audioUrl is present)
//     <PlayPauseButton />
//     <ScrubberAndTimes />
//     <SpeedSelector />
// </ReaderAudioPlayer>

import { useState, useRef, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Play, Pause, RotateCcw, Sparkles, Volume2 } from '@/components/icons'
import { fetchReaderAudioUrl } from '@/lib/practice/reader/queries'
import { updateReaderPassageAudioUrl } from '@/lib/db'

interface ReaderAudioPlayerProps {
  passageId: string
  passageText: string
  initialAudioUrl?: string
  online: boolean
  onAudioReady?: (url: string) => void
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25]

export function ReaderAudioPlayer({
  passageId,
  passageText,
  initialAudioUrl,
  online,
  onAudioReady,
}: ReaderAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | undefined>(initialAudioUrl)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl)
    }
  }, [initialAudioUrl])

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current
    if (!audio) return
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  function handleSpeedChange(rate: number) {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }

  function handleRestart() {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = 0
    setCurrentTime(0)
    void audio.play()
    setIsPlaying(true)
  }

  if (!audioUrl) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-raised p-3.5 shadow-xs transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Volume2 className="size-4" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-fg">Voz nativa de alta fidelidad</p>
            <p className="text-caption text-fg-muted">
              Genera la narración hablada con Gemini TTS y déjala lista para escuchar siempre.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 w-full sm:w-auto">
          {errorMsg && (
            <span className="text-caption text-danger">{errorMsg}</span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateAudio}
            disabled={!online || isGenerating}
            className="w-full sm:w-auto font-medium"
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>{isGenerating ? 'Generando voz HD...' : 'Generar voz HD 🎙️'}</span>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/30 p-3.5 shadow-xs transition-colors">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration)
          }
        }}
        onEnded={() => {
          setIsPlaying(false)
          setCurrentTime(0)
        }}
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge label="Voz HD lista (Puck)" variant="default" size="sm" />
          <span className="text-caption font-mono text-fg-muted">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleSpeedChange(rate)}
              className={`rounded px-1.5 py-0.5 text-caption font-mono font-medium transition-colors ${
                playbackRate === rate
                  ? 'bg-primary text-primary-fg shadow-xs'
                  : 'text-fg-muted hover:text-fg hover:bg-surface-sunken'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

      {/* Player Controls & Scrubber */}
      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={togglePlay}
          className="size-8 rounded-full p-0 flex items-center justify-center shrink-0"
          aria-label={isPlaying ? 'Pausar audio' : 'Reproducir audio'}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestart}
          className="size-8 rounded-full p-0 text-fg-muted hover:text-fg shrink-0"
          aria-label="Reiniciar audio"
        >
          <RotateCcw className="size-3.5" />
        </Button>

        <div className="relative flex flex-1 items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            aria-label="Progreso de lectura"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-border-default accent-primary focus-ring"
          />
        </div>
      </div>
    </div>
  )
}
