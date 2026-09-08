'use client'

// Planned structure:
// <CoachLine>
//   <LineText /> — SpokenLine con la palabra en curso resaltada
//   <ReplayButton />
//   <ContinueButton />

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpokenWordHighlight } from '@/hooks/useSpokenWordHighlight'
import { splitSpokenWords } from '@/lib/speech/word-timings'
import Button from '@/components/ui/Button'
import { ArrowRight, Volume2 } from '@/components/icons'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import { fetchMissionLineAudio } from '@/lib/ai-practice/missions/scripted/audio-queries'
import { updateGeneratedScriptLineAudio } from '@/lib/ai-practice/missions/scripted/generated-store'
import { SpokenLine } from './SpokenLine'

interface Props {
  line: ScriptLine
  onContinue: () => void
  missionId?: string
}

/**
 * Duracion estimada cuando el motor no la da: ~60ms por caracter hablado
 * es una aproximacion razonable a ritmo normal, y solo alimenta una pista
 * visual — si sale corta, el resaltado termina antes que el audio.
 */
const MS_PER_CHAR = 60

function estimatedDuration(text: string): number {
  return Math.max(600, text.length * MS_PER_CHAR)
}

/** Indice de la palabra que contiene una posicion en caracteres. */
function wordIndexAtChar(text: string, charIndex: number): number {
  const words = splitSpokenWords(text)
  let cursor = 0
  for (let index = 0; index < words.length; index += 1) {
    const found = text.indexOf(words[index] as string, cursor)
    if (found > charIndex) return Math.max(0, index - 1)
    cursor = found + (words[index] as string).length
  }
  return Math.max(0, words.length - 1)
}

export function CoachLine({ line, onContinue, missionId }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)
  const autoplayedRef = useRef<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const highlight = useSpokenWordHighlight({ text: line.text })
  const [hdAudioUrl, setHdAudioUrl] = useState<string | undefined>(line.modelAudio?.path)

  useEffect(() => {
    if (line.modelAudio?.path) {
      setHdAudioUrl(line.modelAudio.path)
      return
    }
    if (!missionId || typeof navigator === 'undefined' || !navigator.onLine) return
    let active = true
    void fetchMissionLineAudio(line, missionId)
      .then((url) => {
        if (active && url) {
          setHdAudioUrl(url)
          if (missionId.startsWith('generated.')) {
            void updateGeneratedScriptLineAudio(missionId, line.id, url)
          }
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [line, missionId])

  const handleListen = useCallback((overrideUrl?: string) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    setIsPlaying(true)

    const finish = () => {
      setIsPlaying(false)
      highlight.stop()
    }

    const effectiveAudioUrl = overrideUrl || hdAudioUrl || line.modelAudio?.path

    if (effectiveAudioUrl) {
      const audio = new Audio(effectiveAudioUrl)
      audioRef.current = audio
      highlight.start(line.modelAudio?.durationMs ?? estimatedDuration(line.text))
      audio.onended = finish
      audio.onerror = () => {
        highlight.start(estimatedDuration(line.text))
        speak(line.text, { onEnd: finish, onError: finish })
      }
      void audio.play().catch(() => {
        highlight.start(estimatedDuration(line.text))
        speak(line.text, { onEnd: finish, onError: finish })
      })
      return
    }

    highlight.start(estimatedDuration(line.text))
    speak(line.text, {
      onEnd: finish,
      onError: finish,
      onBoundary: (charIndex) =>
        highlight.markWord(wordIndexAtChar(line.text, charIndex)),
    })
  }, [line, hdAudioUrl, highlight])

  useEffect(() => {
    if (autoplayedRef.current === line.id) return
    autoplayedRef.current = line.id
    handleListen()
  }, [line.id, handleListen])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return (
    <div className="flex flex-col items-start gap-2 animate-message-in">
      <div className="flex items-center gap-2">
        <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
          Coach
        </span>
        {isPlaying && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xxs font-medium text-primary">
            <Volume2 size={12} aria-hidden /> Hablando…
          </span>
        )}
      </div>
      <div className="m-0 max-w-[88%] rounded-lg border border-border-subtle bg-surface-raised/95 px-4 py-3 text-body-md text-fg shadow-xs">
        <SpokenLine text={line.text} activeIndex={highlight.activeIndex} />
      </div>
      <div className="flex items-center gap-2.5 pt-1.5">
        <Button
          variant="secondary"
          size="sm"
          icon={<Volume2 size={16} aria-hidden />}
          onClick={() => handleListen()}
          disabled={isPlaying}
        >
          {isPlaying ? 'Reproduciendo…' : 'Repetir'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<ArrowRight size={16} aria-hidden />}
          iconPosition="right"
          onClick={onContinue}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
