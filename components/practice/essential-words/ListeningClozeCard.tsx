'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { PracticeActionBar, PracticeContinueButton, PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { ListenButton } from '@/components/ui/ListenButton'
import { Check, X } from '@/components/icons'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { speak } from '@/lib/phoneme-practice/tts'
import { selectListeningBlanks } from '@/lib/essential-words/listening-blanks'
import { clozeFor } from '@/lib/essential-words/cloze'
import { selectSentence } from '@/lib/essential-words/sentence-variants'
import { isTypo } from '@/lib/essential-words/typo'
import { normalizeEnglishAnswer, displayEnglishText } from '@/lib/essential-words/word-display'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'
import { ExercisePhaseLabel } from './ExercisePhaseLabel'
import { useEnterToContinue } from '@/hooks/useEnterToContinue'
import type { AttemptOutcome } from '@/lib/essential-words/attempt-grade'
import type { EssentialWord } from '@/lib/essential-words/types'

interface Props {
  entry: EssentialWord
  levelLabel?: string
  repetitions?: number
  tier?: 1 | 2 | 3
  focusContrastId?: string
  retiredBlankKeys?: string[]
  onAttempt: (outcome: AttemptOutcome) => Promise<void>
  onContinue?: () => void
  onArchive?: () => void
  isContinuing?: boolean
}

/** Listening tiers 1–2: editable words are kept in their original context. */
export function ListeningClozeCard({
  entry, levelLabel, repetitions = 0, tier = 1, focusContrastId, retiredBlankKeys = [],
  onAttempt, onContinue, onArchive, isContinuing = false,
}: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const startedAtRef = useRef(Date.now())
  const firstInputRef = useRef<HTMLInputElement>(null)
  const resolved = selectSentence(entry, repetitions)
  const fallbackCloze = clozeFor(entry, resolved.sentence)
  const sentenceWithFallbackTokens = resolved.tokens?.length ? resolved : {
    ...resolved,
    tokens: fallbackCloze ? [{
      start: resolved.sentence.indexOf(fallbackCloze.answer),
      end: resolved.sentence.indexOf(fallbackCloze.answer) + fallbackCloze.answer.length,
      text: fallbackCloze.answer,
      normalized: normalizeEnglishAnswer(fallbackCloze.answer),
      ipa: entry.ipa_strong,
      role: 'content' as const,
      contrastIds: [],
    }] : [],
  }
  const blanks = useMemo(() => selectListeningBlanks(sentenceWithFallbackTokens, tier === 2 ? 2 : 1, focusContrastId).filter((blank, index) => !retiredBlankKeys.includes(`${entry.rank}:${resolved.sentence}:${index}`)), [sentenceWithFallbackTokens, tier, focusContrastId, retiredBlankKeys, entry.rank, resolved.sentence])
  const blankByStart = useMemo(() => new Map(blanks.map((blank) => [blank.token.start, blank])), [blanks])

  useEffect(() => { firstInputRef.current?.focus() }, [])
  useEnterToContinue(Boolean(onContinue && submitted && !isContinuing), onContinue)

  if (blanks.length === 0) return null

  const complete = blanks.every((blank) => answers[blank.token.start]?.trim())
  const submittedWord = (start: number) => answers[start] ?? ''
  const isExact = (text: string, expected: string) => normalizeEnglishAnswer(text) === normalizeEnglishAnswer(expected)
  const submit = () => {
    if (submitted || !complete) return
    const correct = blanks.every((blank) => isExact(submittedWord(blank.token.start), blank.token.text))
    const typo = !correct && blanks.some((blank) => !isExact(submittedWord(blank.token.start), blank.token.text) && isTypo(normalizeEnglishAnswer(submittedWord(blank.token.start)), normalizeEnglishAnswer(blank.token.text)))
    const words = blanks.map((blank) => {
      const written = submittedWord(blank.token.start)
      const exact = isExact(written, blank.token.text)
      const spelling = !exact && isTypo(normalizeEnglishAnswer(written), normalizeEnglishAnswer(blank.token.text))
      return {
        expected: blank.token.text,
        written,
        categoria: exact ? 'ok' as const : spelling ? 'spelling' as const : 'guess' as const,
        isTarget: blank.token.normalized === entry.word.toLowerCase(),
        expectedIpa: blank.token.ipa,
        contrastId: blank.contrastId,
      }
    })
    const hasSpelling = words.some((word) => word.categoria === 'spelling')
    const attempt: AttemptOutcome = {
      correct,
      hintsUsed: 0,
      rescued: false,
      typo,
      firstTryFailed: false,
      latencyMs: Date.now() - startedAtRef.current,
      resultado: correct ? 'correcto' : hasSpelling ? 'casi' : 'incorrecto',
      palabras: words,
      errorDominante: correct ? undefined : hasSpelling ? 'spelling' : 'guess',
      evidencia: correct
        ? [{ habilidad: 'listening', veredicto: 'acierto' }, { habilidad: 'production', veredicto: 'acierto' }]
        : hasSpelling
          ? [{ habilidad: 'listening', veredicto: 'acierto' }, { habilidad: 'production', veredicto: 'fallo' }]
          : [{ habilidad: 'listening', veredicto: 'fallo' }],
      listeningTier: tier,
      focusContrastId,
      guessBlankKeys: words.filter((word) => word.categoria === 'guess').map((word) => ({
        sentenceId: `${entry.rank}:${resolved.sentence}`,
        tokenIndex: blanks.findIndex((blank) => blank.token.text === word.expected),
      })),
    }
    setSubmitted(true)
    playUiCue(correct ? 'correct' : 'wrong')
    void onAttempt(attempt)
  }

  let cursor = 0
  const sentenceParts = sentenceWithFallbackTokens.tokens?.map((token) => {
    const before = sentenceWithFallbackTokens.sentence.slice(cursor, token.start)
    cursor = token.end
    const blank = blankByStart.get(token.start)
    return { before, token, blank }
  }) ?? []
  const tail = sentenceWithFallbackTokens.sentence.slice(cursor)

  return (
    <PracticeExerciseCard>
      <ExercisePhaseLabel label={levelLabel} />
      <div className="flex max-w-[42ch] flex-col items-center gap-2 text-center">
        <p className="m-0 text-label font-semibold text-fg">{submitted ? 'Escucha la diferencia' : `Escucha y completa ${blanks.length === 1 ? 'la palabra' : 'las palabras'}`}</p>
        <p className="m-0 text-caption text-fg-muted">{submitted ? 'Compara tu respuesta con la oración.' : 'Repite la oración las veces que necesites'}</p>
      </div>
      <ListenButton onPlay={() => speak(resolved.sentence, { rate: 0.95 })} label={submitted ? 'Escuchar contexto' : 'Escuchar'} />

      <p className="m-0 max-w-[48ch] text-center text-h3 font-medium leading-relaxed text-balance text-fg">
        {sentenceParts.map(({ before, token, blank }) => (
          <span key={token.start}>
            {before}
            {!blank ? token.text : !submitted ? (
              <input
                ref={blanks[0]?.token.start === token.start ? firstInputRef : undefined}
                value={submittedWord(token.start)}
                onChange={(event) => setAnswers((current) => ({ ...current, [token.start]: event.target.value }))}
                onKeyDown={(event) => { if (event.key === 'Enter' && complete) { event.preventDefault(); submit() } }}
                aria-label="Escribe la palabra que escuchaste"
                className="mx-1 inline-block min-w-[5ch] rounded-xs border border-border-subtle bg-surface-sunken px-1 py-0.5 text-center text-h3 text-fg focus-ring"
                style={{ width: `${Math.max(5, token.text.length + 2)}ch` }}
                autoCapitalize="none" autoCorrect="off" spellCheck={false}
              />
            ) : (
              <span className="mx-0.5 inline">
                {!isExact(submittedWord(token.start), token.text) ? <span className="inline-flex items-center gap-0.5 rounded-xs bg-error-soft px-1 py-0.5 text-error"><X size={14} aria-hidden />{displayEnglishText(submittedWord(token.start))}</span> : null}
                <span className="inline-flex items-center gap-0.5 rounded-xs bg-success-soft px-1 py-0.5 text-success"><Check size={14} aria-hidden />{token.text}</span>
              </span>
            )}
          </span>
        ))}
        {tail}
      </p>

      {!submitted ? (
        <div className="flex w-full flex-col items-center gap-2">
          <Button type="button" variant="primary" onClick={submit} disabled={!complete}>Comprobar</Button>
          {onArchive ? <ArchiveConfirmAction onArchive={onArchive} label="Pausar esta palabra" /> : null}
        </div>
      ) : onContinue ? (
        <PracticeActionBar>
          <PracticeContinueButton onClick={onContinue} disabled={isContinuing} isLoading={isContinuing} />
        </PracticeActionBar>
      ) : null}
    </PracticeExerciseCard>
  )
}
