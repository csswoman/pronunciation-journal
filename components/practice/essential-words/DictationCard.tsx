'use client'

// Planned structure:
// <DictationCard>
//   <ListenButton />
//   <AnswerInput />
//   <HintButton />
//   <InlineFeedback />
//   <AnswerDiff | Reveal />
//   <ContinueButton />
// </DictationCard>

import { useEffect, useRef, useState } from 'react'
import { speak, speakSequence } from '@/lib/phoneme-practice/tts'
import { PillButton } from '@/components/ui/PillButton'
import Button from '@/components/ui/Button'
import { ListenButton } from '@/components/ui/ListenButton'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { buildDictationFeedback, dictationAttemptDiagnostic, splitDictationIntoParts, type DictationFeedback } from '@/lib/essential-words/dictation-feedback'
import { englishPronunciation, isValidEnglishWord } from '@/lib/essential-words/english-word-validator'
import { comparePronunciations } from '@/lib/essential-words/phonetic-substitution'
import { displayEnglishText } from '@/lib/essential-words/word-display'
import { AnswerDiff } from './AnswerDiff'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import {
  PracticeActionBar,
  PracticeContinueButton,
  PracticeExerciseCard,
} from '@/components/practice/session/PracticeActionBar'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
  /** The listening ladder reserves full sentence dictation for its advanced step. */
  isAdvancedListening?: boolean
  listeningTier?: 1 | 2 | 3
  /** SM-2 repetition count — rotates which example sentence is dictated. */
  repetitions?: number
}

export function DictationCard({ entry, levelLabel, onAttempt, onContinue, onArchive, isContinuing = false, isAdvancedListening = false, listeningTier, repetitions = 0 }: Props) {
  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [outcome, setOutcome] = useState<{ correct: boolean; typo: boolean; feedback: DictationFeedback } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const hintsUsedRef = useRef(0)
  const slowAudioUsedRef = useRef(false)
  const segmentedAudioUsedRef = useRef(false)
  const startedAtRef = useRef(Date.now())
  const answerInputRef = useRef<HTMLTextAreaElement>(null)
  const { sentence } = selectSentence(entry, repetitions)
  const allowIsolatedTts = !['preposition', 'conjunction', 'determiner', 'article', 'modal', 'auxiliary', 'pronoun'].includes(entry.pos)

  useEffect(() => {
    if (!revealed) answerInputRef.current?.focus()
  }, [revealed])

  useEnterToContinue(Boolean(onContinue && revealed && outcome && !isContinuing), onContinue)

  const submitOutcome = (finalOutcome: AttemptOutcome) => {
    void onAttempt(finalOutcome)
  }

  const handleCheck = async () => {
    if (revealed || answer.trim() === '' || isChecking) return
    setIsChecking(true)
    try {
      // Only load the dictionary for a word that first looks like a typing
      // edit. Clean matches and ordinary word substitutions stay immediate.
      const preliminary = buildDictationFeedback(answer, sentence, entry.word)
      const candidates = preliminary.words
        .filter((item) => item.status === 'typo' && item.written)
        .map((item) => item.written!)
      const validity = candidates.length > 0
        ? new Map(await Promise.all(
            candidates.map(async (candidate) => [candidate, await isValidEnglishWord(candidate)] as const),
          ))
        : new Map<string, boolean>()
      const pronunciationWords = preliminary.words
        .filter((item) => item.status === 'error' && item.written)
        .flatMap((item) => [item.expected, item.written!])
      const pronunciations = new Map(await Promise.all([...new Set(pronunciationWords)].map(async (word) => [word, await englishPronunciation(word)] as const)))
      const feedback = buildDictationFeedback(
        answer,
        sentence,
        entry.word,
        (word) => validity.get(word) ?? false,
        (expected, written) => {
          const expectedArpa = pronunciations.get(expected)
          const writtenArpa = pronunciations.get(written)
          return expectedArpa && writtenArpa ? comparePronunciations(expectedArpa, writtenArpa) : { kind: 'guess' }
        },
        listeningTier,
      )
      // A dictation result must reflect the full sentence. `targetCorrect` is
      // retained as learning evidence for the focus word, but it must not turn
      // visible feedback green when other dictated words were wrong.
      const correct = feedback.sentenceCorrect
      const typo = feedback.hasTypos

      setRevealed(true)
      setOutcome({ correct, typo, feedback })
      playUiCue(correct ? 'correct' : 'wrong')
      submitOutcome({
        correct,
        hintsUsed: hintsUsedRef.current,
        rescued: false,
        typo,
        firstTryFailed: false,
        latencyMs: Date.now() - startedAtRef.current,
        ...dictationAttemptDiagnostic(feedback),
        listeningTier,
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <PracticeExerciseCard>
      <ExercisePhaseLabel label={levelLabel} />

      <div className="flex w-full flex-col items-center gap-2 text-center">
        {isAdvancedListening ? <p className="m-0 font-kicker text-fg-subtle">Escucha · dictado avanzado</p> : null}
        <p className="m-0 text-label font-semibold text-fg">{revealed ? 'Escucha la diferencia' : 'Escucha y escribe la oración'}</p>
        <p className="m-0 text-caption text-fg-muted">{revealed ? 'Compara lo que escribiste con la palabra correcta' : 'Puedes repetirla antes de responder'}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2" aria-label={revealed ? 'Comparación de audio' : 'Opciones de audio'}>
        {revealed && outcome && allowIsolatedTts && !outcome.feedback.words.some((item) => item.category === 'guess') ? <>
          {outcome.feedback.words.filter((item) => item.status !== 'match' && item.written).slice(0, 1).map((item) => <ListenButton key="written" onPlay={() => speak(item.written!, { rate: 0.95 })} label={item.written!} />)}
          <ListenButton onPlay={() => speak(outcome.feedback.words.find((item) => item.status !== 'match')?.expected ?? entry.word, { rate: 0.95 })} label={outcome.feedback.words.find((item) => item.status !== 'match')?.expected ?? entry.word} />
          <PillButton type="button" variant="outline" size="sm" onClick={() => { const item = outcome.feedback.words.find((candidate) => candidate.status !== 'match'); if (item?.written) speakSequence([item.written, item.expected], { rate: 0.95 }) }}>Comparar</PillButton>
        </> : <ListenButton onPlay={() => speak(sentence, { rate: 0.95 })} label={revealed ? 'Escuchar contexto' : 'Escuchar'} />}
        <PillButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!slowAudioUsedRef.current) {
              slowAudioUsedRef.current = true
              hintsUsedRef.current += 1
            }
            speak(sentence, { rate: 0.75 })
          }}
        >
          0.75x
        </PillButton>
        {!revealed && <PillButton
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!segmentedAudioUsedRef.current) {
              segmentedAudioUsedRef.current = true
              hintsUsedRef.current += 1
            }
            speakSequence(splitDictationIntoParts(sentence), { rate: 0.95 })
          }}
        >
          Por partes
        </PillButton>}
      </div>

      {!revealed && (
        <textarea
          ref={answerInputRef}
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleCheck()
            }
          }}
          aria-label="Escribe lo que escuchaste"
          placeholder="Escribe lo que escuchaste"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="w-full max-w-sm resize-y rounded-md border border-border-subtle bg-surface-sunken px-3 py-2 text-body text-fg focus-ring"
        />
      )}

      {revealed && outcome?.feedback?.hasDifferences ? (
        <AnswerDiff feedback={outcome.feedback} word={entry.word} />
      ) : revealed ? (
        <p className="m-0 max-w-[42ch] text-center text-body-lg text-fg">
          {displayEnglishText(sentence)}
        </p>
      ) : (
        <Button type="button" variant="primary" size="lg" fullWidth onClick={() => void handleCheck()} disabled={isChecking}>
          {isChecking ? 'Comprobando…' : 'Comprobar'}
        </Button>
      )}

      {!revealed && onArchive && (
        <ArchiveConfirmAction onArchive={onArchive} label="Pausar esta palabra" />
      )}

      {revealed && onContinue && (
        <PracticeActionBar>
          <PracticeContinueButton
            onClick={onContinue}
            disabled={isContinuing}
            isLoading={isContinuing}
          />
        </PracticeActionBar>
      )}
    </PracticeExerciseCard>
  )
}
