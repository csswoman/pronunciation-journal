'use client'

// Planned structure:
// <LexiconFlashcard>
//   <FlashcardHeader /> — progress track, undo button & shortcut hints
//   <CardButton />       — spacious interactive flip card with stressed IPA & sentence context
//   <RatingBar />        — 3-level Anki rating buttons (Otra vez, Me costó, La domino) + intervals
// </LexiconFlashcard>

import { useState, useEffect } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import type { FlashcardRating } from '@/lib/word-bank/lexicon-review-types'

interface LexiconFlashcardProps {
  word: string
  ipa?: string
  partOfSpeech?: string
  definition: string
  example?: string | null
  translation?: string
  cardNumber: number
  totalCards: number
  canUndo?: boolean
  disabled?: boolean
  onUndo?: () => void
  onRate: (rating: FlashcardRating) => void
}

function renderIpaFormatted(ipaStr: string, sizeClass = 'text-xl sm:text-2xl') {
  const formatted = ipaStr.startsWith('/') ? ipaStr : `/${ipaStr}/`
  const parts = formatted.split(/(ˈ[^\s/.,]+)/g)

  return (
    <span className={`font-ipa ${sizeClass} font-medium text-fg-muted leading-tight`} aria-label={`Pronunciación IPA: ${formatted}`}>
      {parts.map((part, i) => {
        if (part.startsWith('ˈ')) {
          return (
            <span
              key={i}
              className="font-bold text-primary underline underline-offset-4 decoration-primary/50"
              title="Sílaba con acento primario"
            >
              {part}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export function LexiconFlashcard({
  word,
  ipa,
  partOfSpeech,
  definition,
  example,
  translation,
  cardNumber,
  totalCards,
  canUndo = false,
  disabled = false,
  onUndo,
  onRate,
}: LexiconFlashcardProps) {
  const [revealed, setRevealed] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  function handleRate(rating: FlashcardRating) {
    if (disabled) return
    onRate(rating)
  }

  function handlePlayAudio(e?: React.MouseEvent) {
    if (e) e.stopPropagation()
    const textToSpeak = [word, definition, example ? `For example: ${example}` : '']
      .filter(Boolean)
      .join('. ')
    speak(textToSpeak, { rate: 0.9 })
  }

  // Keyboard shortcut handler for fast Anki review & Undo (Z / Ctrl+Z)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || disabled) {
        return
      }

      // Undo with Z or Ctrl+Z / Cmd+Z
      if ((e.key === 'z' || e.key === 'Z') && canUndo && onUndo) {
        e.preventDefault()
        onUndo()
        return
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        if (!revealed) {
          e.preventDefault()
          setRevealed(true)
        }
      } else if (revealed) {
        if (e.key === '1') {
          e.preventDefault()
          handleRate('forgot')
        } else if (e.key === '2') {
          e.preventDefault()
          handleRate('normal')
        } else if (e.key === '3') {
          e.preventDefault()
          handleRate('known')
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [revealed, canUndo, onUndo, disabled])

  const progressPercent = Math.round((cardNumber / totalCards) * 100)

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 mx-auto">
      {/* Top Header & Visual Progress Track */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-body-sm text-fg-subtle">
          <div className="flex items-center gap-3">
            <span className="font-medium text-fg-muted">Tarjeta {cardNumber} de {totalCards}</span>
            {canUndo && onUndo && (
              <button
                type="button"
                onClick={onUndo}
                disabled={disabled}
                className="inline-flex items-center gap-1 text-tiny text-fg-subtle hover:text-fg underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Deshacer última valoración (Z)"
              >
                <span>↺ Deshacer</span>
                <span className="font-mono text-xxs opacity-70">(Z)</span>
              </button>
            )}
          </div>
          <span className="font-mono text-tiny text-fg-subtle">
            {!revealed ? 'Espacio para revelar' : 'Presiona 1, 2 o 3'}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-sunken overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Flashcard Container */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => !revealed && setRevealed(true)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !revealed) {
            e.preventDefault()
            setRevealed(true)
          }
        }}
        aria-label={revealed ? undefined : `Toca para revelar definición de ${word}`}
        className="min-h-[300px] sm:min-h-[340px] w-full cursor-pointer rounded-2xl border border-border-subtle bg-surface-raised p-7 sm:p-9 shadow-sm transition-all hover:border-border-strong hover:shadow-md flex flex-col justify-between text-left focus-ring"
      >
        {!revealed ? (
          /* Card Front */
          <div className="flex flex-col justify-between h-full gap-8 my-auto">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-3xl sm:text-4xl font-bold text-fg tracking-tight">{word}</h2>
                {ipa && renderIpaFormatted(ipa, 'text-xl sm:text-2xl')}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {partOfSpeech && (
                  <span className="text-caption italic font-medium px-3 py-1 rounded-md bg-surface-sunken text-fg-subtle">
                    {partOfSpeech}
                  </span>
                )}
                <ListenButton iconOnly onPlay={handlePlayAudio} aria-label={`Escuchar ${word}`} />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle/50 pt-5 text-body-sm text-fg-subtle">
              <span className="inline-flex items-center gap-1.5 font-medium text-fg-muted">
                Toca la tarjeta para revelar definición
              </span>
              <span className="font-mono text-tiny px-2 py-0.5 rounded bg-surface-sunken text-fg-subtle">
                Espacio ↵
              </span>
            </div>
          </div>
        ) : (
          /* Card Back */
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl sm:text-3xl font-bold text-fg tracking-tight">{word}</h2>
                {ipa && renderIpaFormatted(ipa, 'text-lg sm:text-xl')}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {partOfSpeech && (
                  <span className="text-caption italic text-fg-subtle px-2.5 py-1 rounded bg-surface-sunken font-medium">
                    {partOfSpeech}
                  </span>
                )}
                <ListenButton iconOnly onPlay={handlePlayAudio} aria-label={`Escuchar ${word}`} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="text-body-md sm:text-lg text-fg leading-relaxed">
                {definition}
              </p>

              {example && (
                <div className="rounded-xl border border-border-subtle/60 bg-surface-sunken p-4 text-body-sm text-fg-muted">
                  <p className="font-kicker text-fg-subtle mb-1">Ejemplo en contexto</p>
                  <p className="italic leading-relaxed text-fg">"{example}"</p>
                </div>
              )}

              {translation && (
                <div onClick={(e) => e.stopPropagation()} className="pt-1">
                  {showTranslation ? (
                    <div className="rounded-lg bg-surface-sunken/60 px-3.5 py-2 text-body-sm text-fg-muted">
                      <span className="text-fg-subtle font-medium mr-2">Traducción:</span>
                      <span className="text-fg font-medium">{translation}</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowTranslation(true)}
                      className="text-caption text-fg-subtle underline underline-offset-2 hover:text-fg transition-colors"
                    >
                      Mostrar traducción
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Anki Rating Action Bar with Interval Estimates */}
      {revealed && (
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleRate('forgot')}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-error/40 bg-error-soft px-4 py-3 text-body-sm font-semibold text-error transition-all hover:bg-error/20 active:scale-[0.98] focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono text-tiny opacity-75">[1]</span>
              <span>Otra vez</span>
            </div>
            <span className="text-tiny font-normal opacity-80">Próximamente</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate('normal')}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-body-sm font-semibold text-fg transition-all hover:border-border-strong active:scale-[0.98] focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono text-tiny opacity-60">[2]</span>
              <span>Me costó</span>
            </div>
            <span className="text-tiny font-normal text-fg-subtle">En 1-2 días</span>
          </button>

          <button
            type="button"
            onClick={() => handleRate('known')}
            disabled={disabled}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-primary/40 bg-primary-soft px-4 py-3 text-body-sm font-semibold text-primary transition-all hover:bg-primary/20 active:scale-[0.98] focus-ring disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-1">
              <span className="font-mono text-tiny opacity-75">[3]</span>
              <span>La domino</span>
            </div>
            <span className="text-tiny font-normal opacity-80">En 4-7 días</span>
          </button>
        </div>
      )}
    </div>
  )
}
