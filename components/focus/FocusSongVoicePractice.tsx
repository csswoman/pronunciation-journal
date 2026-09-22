'use client'

// Planned structure:
// <FocusSongVoicePractice>
//   <LinePrompt />
//   <RecorderControls />
//   <TranscriptFeedback /> | <FinalScore />
// </FocusSongVoicePractice>

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { speak } from '@/lib/phoneme-practice/tts'
import { alignPronunciationWords } from '@/lib/pronunciation/scoring'
import { isTranscriptScorable } from '@/lib/speech/transcript-quality'
import type { SongBody } from '@/lib/focus/types'
import type { ExerciseResult } from '@/lib/practice/types'

type LineScore = { score: number; missed: string[] }

export function evaluateLine(target: string, transcript: string): LineScore {
  const words = (value: string) => value.toLowerCase().replace(/[^a-z\s']/g, '').trim().split(/\s+/).filter(Boolean)
  const aligned = alignPronunciationWords(words(target), words(transcript), true)
  const expected = aligned.filter((word) => word.status !== 'extra')
  return {
    score: expected.length ? Math.round(expected.filter((word) => word.status === 'correct').length / expected.length * 100) : 0,
    missed: [...new Set(expected.filter((word) => word.status !== 'correct').map((word) => word.expected))].slice(0, 5),
  }
}

export function FocusSongVoicePractice({ body, contentId, onResult, onComplete, onRestart }: {
  body: SongBody
  contentId: string
  onResult: (result: ExerciseResult) => void
  onComplete: (results: ExerciseResult[]) => void
  onRestart: () => void
}) {
  const lines = useMemo(() => {
    const lyrics = body.lyrics.split('\n').map((line) => line.trim()).filter(Boolean)
    const selected = body.gapLines.map((index) => lyrics[index]).filter((line): line is string => Boolean(line))
    return (selected.length ? selected : lyrics).slice(0, 3)
  }, [body])
  const [index, setIndex] = useState(0)
  const [scores, setScores] = useState<LineScore[]>([])
  const rowsRef = useRef<ExerciseResult[]>([])
  const startedAt = useRef(Date.now())
  const { status, result, userAudioUrl, errorCode, isSupported, start, stop, reset } = useSpeechRecognition()
  const target = lines[index]
  const current = status === 'done' && result && isTranscriptScorable(result) && target
    ? evaluateLine(target, result.transcript) : null

  useEffect(() => { reset() }, [index, reset])

  if (!target) {
    const average = scores.length ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length) : 0
    const missed = [...new Set(scores.flatMap((item) => item.missed))].slice(0, 6)
    return <div className="rounded-3xl border border-border-default bg-surface-raised p-6" role="status">
      <h3 className="font-display text-h3 text-fg">Práctica oral terminada</h3>
      <p className="mt-2 text-body font-semibold text-fg">Coincidencia de palabras: {average} %</p>
      <p className="mt-2 text-body-sm text-fg-muted">El reconocimiento de voz compara lo que se entendió con la letra. No mide afinación, ritmo ni sonidos individuales.</p>
      {missed.length > 0 && <p className="mt-3 text-body-sm text-fg">Para mejorar, escucha y repite despacio estas palabras que no se reconocieron: {missed.join(', ')}.</p>}
      {missed.length === 0 && <p className="mt-3 text-body-sm text-fg">Se reconocieron todas las palabras. Prueba otra vez cuidando el ritmo y la claridad.</p>}
      <Button className="mt-5" variant="secondary" onClick={() => { rowsRef.current = []; startedAt.current = Date.now(); onRestart(); setIndex(0); setScores([]); reset() }}>Volver a grabar</Button>
    </div>
  }

  return <div className="rounded-3xl border border-border-default bg-surface-raised p-6">
    <p className="font-kicker text-fg-muted">Línea {index + 1} de {lines.length}</p>
    <h3 className="mt-3 text-h3 text-fg">{target}</h3>
    <p className="mt-2 text-body-sm text-fg-muted">Canta o recita esta línea cerca del micrófono. Escucha tu grabación y compara las palabras reconocidas.</p>
    <ListenButton className="mt-4" label="Escuchar el modelo" onPlay={() => speak(target, { rate: 0.85 })} />
    {!isSupported ? <p className="mt-4 text-body-sm text-fg-muted">Tu navegador no permite grabar con micrófono en esta página.</p> : <div className="mt-5 flex flex-wrap gap-3">
      {status === 'listening' ? <Button onClick={stop}>Detener grabación</Button> : <Button onClick={() => { reset(); void start() }} disabled={status === 'processing'}>{status === 'done' || status === 'error' ? 'Grabar otra vez' : 'Grabar mi voz'}</Button>}
    </div>}
    {status === 'listening' && <p className="mt-3 text-body-sm text-fg-muted" role="status">Grabando… canta o recita y pulsa detener.</p>}
    {status === 'processing' && <p className="mt-3 text-body-sm text-fg-muted" role="status">Analizando la grabación…</p>}
    {status === 'error' && <p className="mt-3 text-body-sm text-fg-muted" role="alert">{errorCode === 'not-allowed' ? 'Habilita el micrófono para grabarte.' : errorCode === 'no-speech' ? 'No se detectó voz. Inténtalo de nuevo.' : 'No se pudo transcribir la grabación. Inténtalo de nuevo.'}</p>}
    {userAudioUrl && <audio className="mt-4 w-full" controls src={userAudioUrl} aria-label="Escuchar mi grabación" />}
    {status === 'done' && result && !isTranscriptScorable(result) && <p className="mt-3 text-body-sm text-fg-muted" role="status">El reconocimiento no fue suficientemente claro para puntuar. Vuelve a grabar.</p>}
    {current && result && <div className="mt-5 rounded-xl border border-border-default bg-surface-sunken p-4" role="status">
      <p className="font-semibold text-fg">Coincidencia de palabras: {current.score} %</p>
      <p className="mt-2 text-body-sm text-fg-muted">El reconocedor entendió: “{result?.transcript}”</p>
      <p className="mt-2 text-body-sm text-fg-muted">{current.missed.length ? `Practica y repite: ${current.missed.join(', ')}. La transcripción no permite saber exactamente qué sonido falló.` : 'Se reconocieron las palabras de esta línea.'}</p>
      <Button className="mt-4" onClick={() => {
        const row: ExerciseResult = {
          exerciseId: `voice-${index}`, slug: 'speak_word', exerciseTypeId: 10,
          isCorrect: current.score >= 80, userAnswer: result.transcript, score: current.score,
          timeMs: Date.now() - startedAt.current, status: 'answered', contentId: `${contentId}:voice-${index}`,
          context: 'practice', sourceRef: { source: 'focus_content', id: contentId },
          exercisePayload: { type: 'focus_song_voice', taskSkill: 'speaking', target, transcript: result.transcript, score: current.score }, completedAt: new Date(),
        }
        rowsRef.current = [...rowsRef.current, row]
        onResult(row)
        if (index + 1 === lines.length) onComplete(rowsRef.current)
        startedAt.current = Date.now()
        setScores((previous) => [...previous, current]); setIndex((value) => value + 1)
      }}>{index + 1 === lines.length ? 'Ver resultado' : 'Siguiente línea'}</Button>
    </div>}
  </div>
}
