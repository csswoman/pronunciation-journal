'use client'

// Planned structure:
// <SentenceContinuousFeedback>
//   <SentenceReadingBox>
//     <SentenceTextLine />
//     <SentenceIpaLine />
//   </SentenceReadingBox>
//   <PlaybackBar />
//   <ErrorDetailPanel />
// </SentenceContinuousFeedback>

import { useState } from 'react'
import type { WordResult, PhonemeAlignment } from '@/lib/types'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import { buildRemediation } from '@/lib/pronunciation/syllable-remediation'
import {
  buildDetailedTip,
  getPhonemeErrorDescription,
} from './PronunciationFeedbackChips'

interface Props {
  wordResults: WordResult[]
  syllableMap: Map<string, SyllableResult[]>
}

export function SentenceContinuousFeedback({ wordResults, syllableMap }: Props) {
  const [selectedWordIdx, setSelectedWordIdx] = useState<number | null>(null)
  const [selectedPhoneme, setSelectedPhoneme] = useState<PhonemeAlignment | null>(null)

  const fullSentence = wordResults
    .map((w) => w.expected || w.got)
    .filter(Boolean)
    .join(' ')

  const selectedWord = selectedWordIdx !== null ? wordResults[selectedWordIdx] : null

  const handleSelectWord = (idx: number) => {
    if (selectedWordIdx === idx && selectedPhoneme === null) {
      setSelectedWordIdx(null)
      return
    }
    setSelectedWordIdx(idx)
    setSelectedPhoneme(null)
    const word = wordResults[idx]
    if (word?.expected) {
      speak(word.expected)
    }
  }

  const handleSelectPhoneme = (wordIdx: number, p: PhonemeAlignment) => {
    if (selectedWordIdx === wordIdx && selectedPhoneme === p) {
      setSelectedWordIdx(null)
      setSelectedPhoneme(null)
      return
    }
    setSelectedWordIdx(wordIdx)
    setSelectedPhoneme(p)
    if (p.ipa) {
      playIpaSound(p.ipa)
    }
  }

  const handleSpeakNormal = () => {
    if (fullSentence) {
      speak(fullSentence)
    }
  }

  const handleSpeakSlow = () => {
    if (fullSentence) {
      speak(fullSentence, { rate: 0.6 })
    }
  }

  const remediation = selectedPhoneme
    ? buildRemediation(selectedPhoneme)
    : selectedWord?.phonemes?.alignment?.find((p) => p.status !== 'correct')
      ? buildRemediation(
          selectedWord.phonemes.alignment.find((p) => p.status !== 'correct')!,
        )
      : null

  return (
    <div className="space-y-3">
      {/* Contenedor continuo de la frase */}
      <div className="rounded-xl border border-border-default bg-surface-raised p-4 space-y-3 shadow-xs">
        {/* Línea de texto completa con palabras coloreadas */}
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1 text-h3 sm:text-h2 font-semibold leading-normal">
          {wordResults.map((word, idx) => {
            const syllables = word.status === 'incorrect' ? syllableMap.get(word.expected) : undefined
            const hasError =
              word.status === 'incorrect' ||
              word.status === 'missing' ||
              word.phonemes?.alignment?.some((p) => p.status !== 'correct')
            const isSelected = selectedWordIdx === idx

            if (syllables && syllables.length > 0) {
              return (
                <span key={idx} className="inline-flex items-baseline">
                  {syllables.map((syl, sIdx) => {
                    const isSylError = syl.status !== 'correct'
                    if (!isSylError) {
                      return (
                        <span key={sIdx} className="text-success">
                          {syl.text}
                        </span>
                      )
                    }
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSelectWord(idx)}
                        aria-expanded={isSelected}
                        aria-label={`${syl.text}: error de pronunciación. Clic para ver detalle.`}
                        className={cn(
                          'cursor-pointer rounded-xs transition-colors focus-ring',
                          syl.status === 'error'
                            ? 'text-error font-bold border-b-2 border-error'
                            : 'text-warning font-semibold border-b-2 border-warning',
                          isSelected && 'bg-error-soft/30',
                        )}
                      >
                        {syl.text}
                      </button>
                    )
                  })}
                </span>
              )
            }

            if (!hasError && word.status === 'correct') {
              return (
                <span key={idx} className="text-success">
                  {word.expected}
                </span>
              )
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectWord(idx)}
                aria-expanded={isSelected}
                aria-label={`${word.expected || word.got}: error. Clic para ver detalle.`}
                className={cn(
                  'cursor-pointer rounded-xs transition-colors focus-ring',
                  word.status === 'incorrect'
                    ? 'text-error font-bold border-b-2 border-error'
                    : word.status === 'missing'
                      ? 'text-warning font-semibold border-b-2 border-warning line-through'
                      : 'text-fg-subtle line-through',
                  isSelected && 'bg-error-soft/30',
                )}
              >
                {word.expected || word.got}
              </button>
            )
          })}
        </div>

        {/* Línea IPA continua */}
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-body-sm sm:text-body font-ipa text-fg-muted">
          <span>/</span>
          {wordResults.map((word, wIdx) => {
            const alignments = word.phonemes?.alignment ?? []
            if (alignments.length === 0) {
              return (
                <span key={wIdx} className="text-fg-subtle">
                  {word.expected}
                </span>
              )
            }

            return (
              <span key={wIdx} className="inline-flex items-baseline gap-0.5">
                {alignments.map((p, pIdx) => {
                  const display = p.ipa ?? p.phoneme.toLowerCase()
                  const isProblem = p.status === 'incorrect' || p.status === 'missing'
                  const isThisPhonemeSelected = selectedWordIdx === wIdx && selectedPhoneme === p

                  if (!isProblem) {
                    return (
                      <span key={pIdx} className="text-success">
                        {display}
                      </span>
                    )
                  }

                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSelectPhoneme(wIdx, p)}
                      aria-label={`Fonema /${display}/: ${p.status === 'missing' ? 'falta' : 'incorrecto'}. Clic para escuchar y ver detalle.`}
                      className={cn(
                        'cursor-pointer rounded-xs px-0.5 transition-all focus-ring',
                        p.status === 'missing'
                          ? 'text-warning line-through font-semibold'
                          : 'text-error font-bold',
                        isThisPhonemeSelected && 'bg-error-soft/40 underline',
                      )}
                    >
                      {display}
                    </button>
                  )
                })}
              </span>
            )
          })}
          <span>/</span>
        </div>

        {/* Controles de reproducción rápida */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSpeakNormal}
            aria-label="Escuchar velocidad normal"
            title="Escuchar velocidad normal"
            className="grid h-9 w-9 place-items-center rounded-full border border-border-default bg-surface text-primary transition-colors hover:bg-surface-sunken focus-ring cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleSpeakSlow}
            aria-label="Escuchar velocidad lenta"
            title="Escuchar velocidad lenta"
            className="grid h-9 w-9 place-items-center rounded-full border border-border-default bg-surface text-primary transition-colors hover:bg-surface-sunken focus-ring cursor-pointer"
          >
            <span className="text-base leading-none" aria-hidden="true">🐌</span>
          </button>
        </div>
      </div>

      {/* Panel Desplegable de Detalle de Error */}
      {selectedWord && (
        <div className="animate-fadeIn rounded-lg border border-border-default bg-surface-raised p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2">
            <div className="flex items-center gap-2">
              <span className="text-body leading-none" aria-hidden="true">💡</span>
              <span className="font-semibold text-body-sm text-fg">
                {selectedPhoneme
                  ? `Sonido /${selectedPhoneme.ipa ?? selectedPhoneme.phoneme}/ en "${selectedWord.expected}"`
                  : `Palabra "${selectedWord.expected || selectedWord.got}"`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedWordIdx(null)
                setSelectedPhoneme(null)
              }}
              className="text-fg-muted hover:text-fg text-caption px-1.5 py-0.5 rounded cursor-pointer focus-ring"
              aria-label="Cerrar detalle de error"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-caption text-fg">
            {selectedPhoneme ? (
              <p className="m-0 text-body-sm font-medium text-fg leading-relaxed">
                {getPhonemeErrorDescription(selectedPhoneme)}
              </p>
            ) : (
              <p className="m-0 text-body-sm text-fg leading-relaxed">
                {buildDetailedTip(selectedWord) ?? 'Revisa la pronunciación de esta palabra.'}
              </p>
            )}

            {selectedWord.status === 'incorrect' && selectedWord.got && (
              <p className="m-0 text-fg-subtle text-caption">
                Reconocido: &ldquo;{selectedWord.got}&rdquo; (esperado: &ldquo;{selectedWord.expected}&rdquo;)
              </p>
            )}

            {remediation?.visualCueEs && (
              <p className="m-0 text-fg-muted text-caption">
                👉 {remediation.visualCueEs}
              </p>
            )}
            {remediation?.spanishTip && (
              <p className="m-0 text-fg-muted text-caption">
                💡 {remediation.spanishTip}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {selectedPhoneme?.ipa && (
                <button
                  type="button"
                  onClick={() => playIpaSound(selectedPhoneme.ipa!)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface px-2.5 py-1 text-caption font-medium text-fg hover:border-primary focus-ring cursor-pointer"
                >
                  <span>Escuchar /{selectedPhoneme.ipa}/</span>
                  <span aria-hidden="true">🔊</span>
                </button>
              )}
              {selectedWord.expected && (
                <button
                  type="button"
                  onClick={() => speak(selectedWord.expected)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-surface px-2.5 py-1 text-caption font-medium text-fg hover:border-primary focus-ring cursor-pointer"
                >
                  <span>Escuchar &ldquo;{selectedWord.expected}&rdquo;</span>
                  <span aria-hidden="true">🔊</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
