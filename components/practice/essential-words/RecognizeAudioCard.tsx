'use client'

// Planned structure:
// <RecognizeAudioCard>
//   <PhaseLabel />
//   <Instruction />
//   <ListenButton />
//   <RecognizeOptionGrid />
//   <InlineFeedback />
//   <ContinueButton />
// </RecognizeAudioCard>

import { useEffect, useMemo, useRef, useState } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { Check, Play, X } from '@/components/icons'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectAudioDistractors } from '@/lib/essential-words/distractors'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import Button from '@/components/ui/Button'
import { PracticeActionBar, PracticeContinueButton, PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { cn } from '@/lib/cn'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  distractors: EssentialWord[]
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  /** Present once the choice has been graded — renders the internal
   * "Continuar" action that advances to the next exercise. */
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
}

const OPTION_COUNT = 3

function firstVowel(ipa: string): string | null {
  return ipa.match(/[iɪeɛæɑɔoʊuʊʌəɚɝɜ]/)?.[0] ?? null
}

function comparisonCopy(correct: EssentialWord, chosen: EssentialWord): string {
  const correctVowel = firstVowel(correct.ipa_strong)
  const chosenVowel = firstVowel(chosen.ipa_strong)
  if (correctVowel && chosenVowel && correctVowel !== chosenVowel) {
    return `La diferencia está en la vocal: /${correctVowel}/ frente a /${chosenVowel}/.`
  }
  return `Compara los sonidos de “${displayEnglishWord(correct.word)}” y “${displayEnglishWord(chosen.word)}”.`
}

export function RecognizeAudioCard({ entry, distractors, levelLabel, onAttempt, onContinue, onArchive, isContinuing = false }: Props) {
  const [chosen, setChosen] = useState<string | null>(null)
  const startedAtRef = useRef(Date.now())

  const play = () => speak(entry.word, { rate: 0.9 })

  useEffect(() => {
    speak(entry.word, { rate: 0.9 })
  }, [entry.word])

  const wrong = useMemo(
    () => selectAudioDistractors(entry, distractors, OPTION_COUNT - 1),
    [entry, distractors],
  )
  const wrongKey = wrong.map((word) => word.word).join('|')

  // Keyed on word content (not array reference) so the shuffle stays stable
  // across parent re-renders that recompute `distractors` with a new
  // reference but the same words — otherwise the options jump after choosing.
  const options = useMemo(() => {
    const all = [entry, ...wrong]
    return all.sort(() => Math.random() - 0.5)
  }, [entry, wrongKey])

  const handleChoose = (choice: string) => {
    if (chosen) return
    setChosen(choice)
    const isCorrect = choice.toLowerCase() === entry.word.toLowerCase()
    playUiCue(isCorrect ? 'correct' : 'wrong')
    if (!isCorrect) window.setTimeout(play, 180)
    void onAttempt({
      correct: isCorrect,
      hintsUsed: 0,
      rescued: false,
      typo: false,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
    })
  }

  useEnterToContinue(Boolean(onContinue && chosen && !isContinuing), onContinue)

  const chosenOption = options.find((option) => option.word === chosen)
  const incorrectChoice = chosenOption && chosenOption.word !== entry.word ? chosenOption : null
  return (
    <PracticeExerciseCard className="max-w-md">
      <ExercisePhaseLabel label={levelLabel} />

      <div className="flex w-full flex-col items-center gap-3 text-center">
        <ListenButton
          onPlay={play}
          label="Escuchar"
          className="h-16 min-w-48 justify-center rounded-md px-6 text-body font-semibold transition-[scale,background-color] duration-150 ease-out-quart active:scale-[0.96]"
        />
        <p className="m-0 text-label font-semibold text-fg">¿Qué palabra escuchaste?</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {options.map((option, index) => {
          const optionIsChosen = chosen === option.word
          const optionIsCorrect = option.word.toLowerCase() === entry.word.toLowerCase()
          const optionState = !chosen
            ? 'neutral'
            : optionIsCorrect
              ? 'correct'
              : optionIsChosen
                ? 'incorrect'
                : 'neutral'

          return (
            <button
              key={option.word}
              type="button"
              onClick={() => handleChoose(option.word)}
              disabled={Boolean(chosen)}
              aria-label={`${index + 1}. ${displayEnglishWord(option.word)}`}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-md border px-4 py-3 text-left',
                'bg-surface text-body font-semibold text-fg transition-[background-color,border-color,color,scale] duration-150 ease-out-quart focus-ring',
                'hover:bg-surface-sunken active:scale-[0.96] disabled:cursor-not-allowed',
                optionState === 'correct' && 'border-success bg-success-soft text-success',
                optionState === 'incorrect' && 'border-error bg-error-soft text-error',
              )}
            >
              <span className="flex size-6 shrink-0 items-center justify-center" aria-hidden>
                {optionState === 'correct' ? <Check size={20} /> : optionState === 'incorrect' ? <X size={20} /> : <kbd className="rounded-xs border border-border-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-caption tabular-nums text-fg-subtle">{index + 1}</kbd>}
              </span>
              <span className="min-w-0 flex-1">{displayEnglishWord(option.word)}</span>
              {chosen && <span className="shrink-0 font-ipa text-body-sm text-fg-muted">/{option.ipa_strong}/</span>}
            </button>
          )
        })}
      </div>

      {incorrectChoice && (
        <div className="flex w-full flex-col gap-3 rounded-md bg-surface-sunken p-4">
          <p className="m-0 text-body-sm text-fg">
            {comparisonCopy(entry, incorrectChoice)} Ya puedes volver a escuchar la respuesta.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Play size={16} aria-hidden />}
            className="self-start"
            onClick={() => speakSequence([incorrectChoice.word, entry.word], { rate: 0.9 })}
          >
            Comparar sonidos
          </Button>
        </div>
      )}

      {chosen && onContinue && (
        <PracticeActionBar>
          <PracticeContinueButton onClick={onContinue} disabled={isContinuing} isLoading={isContinuing} />
        </PracticeActionBar>
      )}

      {!chosen && onArchive && (
        <ArchiveConfirmAction onArchive={onArchive} label="Saltar esta palabra por ahora" />
      )}
    </PracticeExerciseCard>
  )
}
